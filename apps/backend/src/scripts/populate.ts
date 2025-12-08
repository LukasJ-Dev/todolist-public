import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { connectToDB } from '../config/db';
import { validateServerEnv } from '../config/env';
import { userModel, IUser } from '../models/userModel';
import { TodolistModel, ITodolist } from '../models/todolistModel';
import { TaskModel, ITask } from '../models/taskModel';
import {
  ConversationMessageModel,
  IConversationMessage,
} from '../models/conversationMessageModel';

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, './../../.env'),
});

// User activity levels
type ActivityLevel = 'high' | 'medium' | 'low';

interface UserMetadata {
  activityLevel: ActivityLevel;
  createdAt: Date;
  lastActiveDate?: Date;
  isInactive: boolean;
}

// Populate options interface
interface PopulateOptions {
  users: number;
  todolistsPerUser: number;
  tasksPerTodolist: number;
  conversationsPerUser: number;
  messagesPerConversation: number;
  daysBack: number;
  seed?: number;
}

// Default values
const DEFAULT_OPTIONS: PopulateOptions = {
  users: 10,
  todolistsPerUser: 3,
  tasksPerTodolist: 5,
  conversationsPerUser: 2,
  messagesPerConversation: 5,
  daysBack: 30,
};

// Parse command line arguments
function parseArgs(): PopulateOptions {
  const args = process.argv.slice(2);
  const options: PopulateOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--users':
        if (value && !isNaN(Number(value))) {
          options.users = parseInt(value, 10);
          i++;
        }
        break;
      case '--todolists-per-user':
        if (value && !isNaN(Number(value))) {
          options.todolistsPerUser = parseInt(value, 10);
          i++;
        }
        break;
      case '--tasks-per-todolist':
        if (value && !isNaN(Number(value))) {
          options.tasksPerTodolist = parseInt(value, 10);
          i++;
        }
        break;
      case '--conversations-per-user':
        if (value && !isNaN(Number(value))) {
          options.conversationsPerUser = parseInt(value, 10);
          i++;
        }
        break;
      case '--messages-per-conversation':
        if (value && !isNaN(Number(value))) {
          options.messagesPerConversation = parseInt(value, 10);
          i++;
        }
        break;
      case '--days-back':
        if (value && !isNaN(Number(value))) {
          options.daysBack = parseInt(value, 10);
          i++;
        }
        break;
      case '--seed':
        if (value && !isNaN(Number(value))) {
          options.seed = parseInt(value, 10);
          i++;
        }
        break;
    }
  }

  return options;
}

// Helper function to classify users by activity level
function classifyUserActivity(): ActivityLevel {
  const rand = Math.random();
  // 20% highly active, 50% moderately active, 30% low activity
  if (rand < 0.2) return 'high';
  if (rand < 0.7) return 'medium';
  return 'low';
}

// Generate date with exponential distribution (more recent dates are more likely)
function getExponentialDate(
  daysBack: number,
  index: number,
  total: number
): Date {
  // Use random distribution instead of exponential
  // Add slight variation based on index to avoid clustering, but keep it mostly random
  const baseRandom = Math.random();
  const indexVariation = (index / total) * 0.2; // Small influence from position (0-20%)
  const randomFactor = baseRandom * 0.8 + indexVariation; // 80% random, 20% position-based

  const daysAgo = daysBack * randomFactor;
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

// Generate date with linear distribution after a parent date
function getLinearDate(
  parentCreatedAt: Date,
  daysBack: number,
  favorRecent: boolean = false
): Date {
  const now = Date.now();
  const parentTime = parentCreatedAt.getTime();
  const timeSinceParent = now - parentTime;
  const maxOffset = Math.min(timeSinceParent, daysBack * 24 * 60 * 60 * 1000);

  let randomOffset: number;
  if (favorRecent) {
    // Favor more recent dates, but less aggressively
    const progress = Math.random();
    const exponentialProgress = Math.pow(progress, 0.7); // Less aggressive (was 0.5)
    randomOffset = maxOffset * exponentialProgress;
  } else {
    // Uniform distribution
    randomOffset = Math.random() * maxOffset;
  }

  const date = new Date(parentTime + randomOffset);
  return date;
}

// Generate date with activity gap (introduces periods of inactivity)
function getDateWithGap(
  lastActivityDate: Date,
  _daysBack: number,
  activityLevel: ActivityLevel
): Date {
  // Low activity users have longer gaps
  const gapDays =
    activityLevel === 'low'
      ? faker.number.int({ min: 3, max: 14 })
      : activityLevel === 'medium'
        ? faker.number.int({ min: 1, max: 7 })
        : faker.number.int({ min: 0, max: 3 });

  const gapMs = gapDays * 24 * 60 * 60 * 1000;
  const newDate = new Date(lastActivityDate.getTime() + gapMs);

  // Don't go beyond now
  const now = Date.now();
  if (newDate.getTime() > now) {
    return new Date(now - Math.random() * 24 * 60 * 60 * 1000); // Random time today
  }

  return newDate;
}

// Generate users with exponential time distribution and activity levels (OPTIMIZED)
async function populateUsers(
  count: number,
  daysBack: number
): Promise<{ users: IUser[]; metadata: Map<string, UserMetadata> }> {
  console.log(`Creating ${count} users...`);
  const users: IUser[] = [];
  const metadata = new Map<string, UserMetadata>();

  const BATCH_SIZE = 500;
  // Pre-hash password once (same as model uses: 12 rounds)
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Track existing emails to avoid duplicates
  const existingEmails = new Set<string>();
  const existingUsers = await userModel.find({}, { email: 1 });
  existingUsers.forEach((user) => existingEmails.add(user.email));

  for (let batchStart = 0; batchStart < count; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, count);
    const userData: Array<{
      name: string;
      email: string;
      password: string;
      createdAt: Date;
    }> = [];
    const batchMetadata: Array<{ index: number; meta: UserMetadata }> = [];

    // Prepare batch data with unique emails
    for (let i = batchStart; i < batchEnd; i++) {
      const createdAt = getExponentialDate(daysBack, i, count);
      const activityLevel = classifyUserActivity();
      const willBeInactive = Math.random() < 0.25;

      // Generate unique email
      let email: string;
      let attempts = 0;
      do {
        email = faker.internet.email().toLowerCase();
        attempts++;
        // Fallback to timestamp-based email if too many attempts
        if (attempts > 10) {
          email = `user_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}@example.com`;
        }
      } while (existingEmails.has(email));
      existingEmails.add(email);

      userData.push({
        name: faker.person.fullName(),
        email,
        password: hashedPassword, // Pre-hashed
        createdAt,
      });

      batchMetadata.push({
        index: i,
        meta: {
          activityLevel,
          createdAt,
          isInactive: willBeInactive,
        },
      });
    }

    // Bulk insert the batch with error handling
    try {
      const insertedUsers = await userModel.insertMany(userData, {
        ordered: false,
      });

      // Map metadata to actual user IDs
      insertedUsers.forEach((user, batchIndex) => {
        const metaEntry = batchMetadata[batchIndex];
        if (metaEntry) {
          metadata.set(user._id.toString(), metaEntry.meta);
          users.push(user);
        }
      });
    } catch (error: unknown) {
      // Handle partial success - some users may have been inserted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mongoError = error as any;
      if (mongoError.writeErrors) {
        // Some documents failed (likely duplicates), but some succeeded
        const insertedCount = mongoError.insertedCount || 0;
        const failedCount = mongoError.writeErrors?.length || 0;
        console.warn(
          `  Batch ${batchStart}-${batchEnd}: ${insertedCount} inserted, ${failedCount} failed (likely duplicates)`
        );

        // Try to get the successfully inserted users
        if (insertedCount > 0) {
          // Find users that were successfully inserted by matching emails
          const successfulEmails = userData
            .filter((_, idx) => {
              // Check if this index had an error
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const hasError = mongoError.writeErrors?.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (err: any) => err.index === idx
              );
              return !hasError;
            })
            .map((u) => u.email);

          if (successfulEmails.length > 0) {
            const successfulUsers = await userModel.find({
              email: { $in: successfulEmails },
            });

            successfulUsers.forEach((user) => {
              const originalIndex =
                batchStart + userData.findIndex((u) => u.email === user.email);
              const metaEntry = batchMetadata.find(
                (m) => m.index === originalIndex
              );
              if (metaEntry) {
                metadata.set(user._id.toString(), metaEntry.meta);
                users.push(user);
              }
            });
          }
        }
      } else {
        // Complete failure - rethrow
        throw error;
      }
    }

    if (batchEnd % 100 === 0 || batchEnd === count) {
      console.log(`  Created ${users.length}/${count} users...`);
    }
  }

  console.log(`✓ Created ${users.length} users`);
  return { users, metadata };
}

// Generate todolists for users with activity patterns (OPTIMIZED)
async function populateTodolists(
  users: IUser[],
  userMetadata: Map<string, UserMetadata>,
  todolistsPerUser: number,
  daysBack: number
): Promise<{
  todolists: ITodolist[];
  todolistDates: Map<string, Date>;
  abandonedTodolists: Set<string>;
}> {
  console.log(`Creating todolists...`);
  const todolists: ITodolist[] = [];
  const todolistDates = new Map<string, Date>();
  const abandonedTodolists = new Set<string>();
  const BATCH_SIZE = 500;

  // Prepare all todolist data first
  interface TodolistData {
    name: string;
    owner: mongoose.Types.ObjectId;
    createdAt: Date;
    isAbandoned: boolean;
  }
  const todolistData: TodolistData[] = [];

  for (const user of users) {
    const metadata = userMetadata.get(user._id.toString());
    if (!metadata) continue;

    if (metadata.isInactive) {
      const oldDate = new Date(
        Date.now() - daysBack * 0.8 * 24 * 60 * 60 * 1000
      );
      if (Math.random() < 0.3) {
        todolistData.push({
          name: faker.company.buzzPhrase() + ' List',
          owner: user._id,
          createdAt: oldDate,
          isAbandoned: true,
        });
      }
      continue;
    }

    let actualTodolistsPerUser = todolistsPerUser;
    if (metadata.activityLevel === 'high') {
      actualTodolistsPerUser = Math.floor(todolistsPerUser * 1.5);
    } else if (metadata.activityLevel === 'low') {
      actualTodolistsPerUser = Math.floor(todolistsPerUser * 0.6);
    }

    let lastActivityDate = metadata.createdAt;
    const hasBurst = Math.random() < 0.3 && metadata.activityLevel !== 'low';
    const burstCount = hasBurst ? Math.floor(actualTodolistsPerUser * 0.4) : 0;
    const regularCount = actualTodolistsPerUser - burstCount;

    if (hasBurst && burstCount > 0) {
      const burstDate = getLinearDate(metadata.createdAt, daysBack, true);
      for (let i = 0; i < burstCount; i++) {
        todolistData.push({
          name: faker.company.buzzPhrase() + ' List',
          owner: user._id,
          createdAt: burstDate,
          isAbandoned: false,
        });
        lastActivityDate = burstDate;
      }
    }

    for (let i = 0; i < regularCount; i++) {
      const createdAt = getDateWithGap(
        lastActivityDate,
        daysBack,
        metadata.activityLevel
      );
      const isAbandoned = Math.random() < 0.35;

      todolistData.push({
        name: faker.company.buzzPhrase() + ' List',
        owner: user._id,
        createdAt,
        isAbandoned,
      });

      if (!isAbandoned) {
        lastActivityDate = createdAt;
      }
      metadata.lastActiveDate = createdAt;
    }
  }

  // Bulk insert in batches
  for (let i = 0; i < todolistData.length; i += BATCH_SIZE) {
    const batch = todolistData.slice(i, i + BATCH_SIZE);
    const batchToInsert = batch.map(
      ({ isAbandoned: _isAbandoned, ...data }) => data
    );
    const inserted = await TodolistModel.insertMany(batchToInsert, {
      ordered: false,
    });

    inserted.forEach((todolist, idx) => {
      const originalData = batch[idx];
      todolists.push(todolist);
      todolistDates.set(todolist._id.toString(), originalData.createdAt);
      if (originalData.isAbandoned) {
        abandonedTodolists.add(todolist._id.toString());
      }
    });
  }

  console.log(`✓ Created ${todolists.length} todolists`);
  return { todolists, todolistDates, abandonedTodolists };
}

// Generate tasks for todolists with timestamps and abandonment patterns (OPTIMIZED)
async function populateTasks(
  todolists: ITodolist[],
  todolistDates: Map<string, Date>,
  abandonedTodolists: Set<string>,
  tasksPerTodolist: number,
  daysBack: number
): Promise<ITask[]> {
  console.log(`Creating tasks...`);
  const tasks: ITask[] = [];
  const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const BATCH_SIZE = 500;

  // Create user map to avoid repeated queries
  const userIds = new Set(todolists.map((t) => t.owner.toString()));
  const users = await userModel.find({ _id: { $in: Array.from(userIds) } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  // Prepare all task data first
  interface TaskData {
    name: string;
    todolist: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    checked: boolean;
    description?: string;
    dueDate?: Date;
    startDate?: Date;
    priority: 'low' | 'medium' | 'high';
    isRecurring: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrenceInterval?: number;
    parentTaskIndex?: number; // Index in todolistTasks array for this todolist
    todolistIndex: number; // Index of todolist in todolists array
    createdAt: Date;
  }
  const taskData: TaskData[] = [];
  const todolistTaskArrays: Map<number, ITask[]> = new Map(); // Track tasks per todolist for parent references

  for (let todolistIdx = 0; todolistIdx < todolists.length; todolistIdx++) {
    const todolist = todolists[todolistIdx];
    const user = userMap.get(todolist.owner.toString());
    if (!user) continue;

    const todolistCreatedAt =
      todolistDates.get(todolist._id.toString()) || todolist.createdAt;
    const isAbandoned = abandonedTodolists.has(todolist._id.toString());

    // Abandoned todolists have fewer tasks, all created soon after todolist creation
    let actualTasksPerTodolist = tasksPerTodolist;
    if (isAbandoned) {
      actualTasksPerTodolist = Math.floor(tasksPerTodolist * 0.6);
      // All tasks created within a week of todolist creation
      const abandonWindow = 7 * 24 * 60 * 60 * 1000;
      const lastTaskDate = new Date(
        todolistCreatedAt.getTime() + abandonWindow
      );
      todolistDates.set(todolist._id.toString(), lastTaskDate);
    }

    const todolistTasks: TaskData[] = [];
    let lastTaskDate = todolistCreatedAt;

    for (let i = 0; i < actualTasksPerTodolist; i++) {
      const isRecurring = faker.datatype.boolean({ probability: 0.2 });
      const hasParent =
        todolistTasks.length > 0 &&
        faker.datatype.boolean({ probability: 0.3 });
      const parentTaskIndex = hasParent
        ? faker.helpers.arrayElement(todolistTasks.map((_, idx) => idx))
        : undefined;

      // Generate task creation date
      let taskCreatedAt: Date;
      if (isAbandoned) {
        const daysAfterTodolist = faker.number.int({ min: 0, max: 7 });
        taskCreatedAt = new Date(
          todolistCreatedAt.getTime() + daysAfterTodolist * 24 * 60 * 60 * 1000
        );
      } else {
        taskCreatedAt = getLinearDate(lastTaskDate, daysBack);
        lastTaskDate = taskCreatedAt;
      }

      if (taskCreatedAt.getTime() > Date.now()) {
        taskCreatedAt = new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1000
        );
      }

      const taskAge = Date.now() - taskCreatedAt.getTime();
      const daysOld = taskAge / (24 * 60 * 60 * 1000);
      const abandonmentProbability = Math.min(0.5, 0.3 + daysOld / 100);
      const isAbandonedTask = Math.random() < abandonmentProbability;

      let dueDate: Date | undefined;
      if (faker.datatype.boolean({ probability: 0.7 })) {
        const calculatedDueDate = new Date(
          taskCreatedAt.getTime() +
            faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000
        );

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        if (calculatedDueDate.getTime() < oneDayAgo) {
          if (Math.random() < 0.5) {
            dueDate = new Date(
              now + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000
            );
          } else {
            if (Math.random() < 0.7) {
              dueDate = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
            }
          }
        } else {
          dueDate = calculatedDueDate;
        }
      }

      const startDate = faker.datatype.boolean({ probability: 0.4 })
        ? new Date(
            taskCreatedAt.getTime() +
              faker.number.int({ min: -7, max: 7 }) * 24 * 60 * 60 * 1000
          )
        : undefined;

      todolistTasks.push({
        name: faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, ''),
        todolist: todolist._id,
        owner: user._id,
        checked: isAbandonedTask
          ? false
          : faker.datatype.boolean({ probability: 0.3 }),
        description: faker.datatype.boolean({ probability: 0.6 })
          ? faker.lorem.paragraph()
          : undefined,
        dueDate,
        startDate,
        priority: faker.helpers.arrayElement(priorities),
        isRecurring,
        recurrenceType: isRecurring
          ? faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'yearly'])
          : undefined,
        recurrenceInterval: isRecurring
          ? faker.number.int({ min: 1, max: 4 })
          : undefined,
        parentTaskIndex,
        todolistIndex: todolistIdx,
        createdAt: taskCreatedAt,
      });
    }

    // Store tasks for this todolist (will be populated after insert)
    todolistTaskArrays.set(todolistIdx, []);
    taskData.push(...todolistTasks);
  }

  // Bulk insert tasks in batches
  const taskIndexMap: Map<number, ITask> = new Map(); // Map from taskData index to inserted task

  for (let i = 0; i < taskData.length; i += BATCH_SIZE) {
    const batch = taskData.slice(i, i + BATCH_SIZE);
    const batchToInsert = batch.map(
      ({
        parentTaskIndex: _parentTaskIndex,
        todolistIndex: _todolistIndex,
        ...data
      }) => ({
        ...data,
        tags: faker.helpers.arrayElements(
          [
            'work',
            'personal',
            'urgent',
            'shopping',
            'health',
            'learning',
            'family',
          ],
          { min: 0, max: 3 }
        ),
      })
    );
    const inserted = await TaskModel.insertMany(batchToInsert, {
      ordered: false,
    });

    inserted.forEach((task, batchIdx) => {
      const originalIndex = i + batchIdx;
      taskIndexMap.set(originalIndex, task);
      tasks.push(task);

      // Store in todolist task array
      const taskInfo = batch[batchIdx];
      const todolistTasks = todolistTaskArrays.get(taskInfo.todolistIndex);
      if (todolistTasks) {
        todolistTasks.push(task);
      }
    });
  }

  // Update parent tasks with subtask references using bulkWrite
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkOps: any[] = [];

  taskData.forEach((taskInfo, index) => {
    if (taskInfo.parentTaskIndex !== undefined) {
      const todolistTasks = todolistTaskArrays.get(taskInfo.todolistIndex);
      if (todolistTasks && todolistTasks[taskInfo.parentTaskIndex]) {
        const parentTask = todolistTasks[taskInfo.parentTaskIndex];
        const childTask = taskIndexMap.get(index);
        if (parentTask && childTask) {
          bulkOps.push({
            updateOne: {
              filter: { _id: parentTask._id },
              update: { $push: { subtasks: childTask._id } },
            },
          });
        }
      }
    }
  });

  // Execute bulk updates in batches
  if (bulkOps.length > 0) {
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await TaskModel.bulkWrite(batch as any, { ordered: false });
    }
  }

  console.log(`✓ Created ${tasks.length} tasks`);
  return tasks;
}

// Generate conversations for users with timestamps and abandonment patterns
async function populateConversations(
  users: IUser[],
  userMetadata: Map<string, UserMetadata>,
  conversationsPerUser: number,
  daysBack: number
): Promise<{
  conversationIds: string[];
  conversationDates: Map<string, Date>;
  conversationUserMap: Map<string, IUser>;
  abandonedConversations: Set<string>;
}> {
  console.log(`Creating conversations...`);
  const conversationIds: string[] = [];
  const conversationDates = new Map<string, Date>();
  const conversationUserMap = new Map<string, IUser>();
  const abandonedConversations = new Set<string>();

  for (const user of users) {
    const metadata = userMetadata.get(user._id.toString());
    if (!metadata) continue;

    // Skip inactive users (they won't have recent conversations)
    if (metadata.isInactive) {
      // Inactive users might have old conversations
      const oldDate = new Date(
        Date.now() - daysBack * 0.8 * 24 * 60 * 60 * 1000
      );
      if (Math.random() < 0.2) {
        // 20% chance of having an old conversation
        const conversationId = `conv_${faker.string.uuid()}`;
        conversationIds.push(conversationId);
        conversationDates.set(conversationId, oldDate);
        conversationUserMap.set(conversationId, user);
      }
      continue;
    }

    // Adjust conversation count based on activity level
    let actualConversationsPerUser = conversationsPerUser;
    if (metadata.activityLevel === 'high') {
      actualConversationsPerUser = Math.floor(conversationsPerUser * 1.5);
    } else if (metadata.activityLevel === 'low') {
      actualConversationsPerUser = Math.floor(conversationsPerUser * 0.6);
    }

    let lastActivityDate = metadata.createdAt;

    for (let j = 0; j < actualConversationsPerUser; j++) {
      const conversationId = `conv_${faker.string.uuid()}`;
      conversationIds.push(conversationId);
      conversationUserMap.set(conversationId, user);

      // Generate conversation creation date with activity gaps
      const createdAt = getDateWithGap(
        lastActivityDate,
        daysBack,
        metadata.activityLevel
      );
      conversationDates.set(conversationId, createdAt);
      lastActivityDate = createdAt;
      metadata.lastActiveDate = createdAt;

      // Some conversations are abandoned (20-30% chance)
      const isAbandoned = Math.random() < 0.25;
      if (isAbandoned) {
        abandonedConversations.add(conversationId);
      }
    }
  }

  console.log(`✓ Created ${conversationIds.length} conversation IDs`);
  return {
    conversationIds,
    conversationDates,
    conversationUserMap,
    abandonedConversations,
  };
}

// Generate messages for conversations with sequential timestamps (OPTIMIZED)
async function populateMessages(
  conversationIds: string[],
  conversationDates: Map<string, Date>,
  conversationUserMap: Map<string, IUser>,
  abandonedConversations: Set<string>,
  messagesPerConversation: number
): Promise<IConversationMessage[]> {
  console.log(`Creating messages...`);
  const messages: IConversationMessage[] = [];
  const BATCH_SIZE = 500;

  // Prepare all message data first
  interface MessageData {
    conversationId: string;
    userId: mongoose.Types.ObjectId;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Array<{
      tool: string;
      input: { taskName: string };
      result: { success: boolean };
    }>;
    createdAt: Date;
  }
  const messageData: MessageData[] = [];

  const prompts = [
    'Can you help me organize my tasks?',
    'What tasks do I have due this week?',
    'Create a task for me',
    'Show me my high priority tasks',
    'Help me plan my day',
    'What should I focus on today?',
    'Add a reminder for tomorrow',
    'List all my incomplete tasks',
  ];

  const responses = [
    'I can help you with that!',
    'Here are your tasks for this week...',
    'Task created successfully.',
    'You have 3 high priority tasks.',
    'Based on your schedule, I recommend...',
    "Here's what I found...",
    "I've added that reminder for you.",
    'You have 5 incomplete tasks.',
  ];

  for (const conversationId of conversationIds) {
    const user = conversationUserMap.get(conversationId);
    if (!user) continue;

    const conversationCreatedAt =
      conversationDates.get(conversationId) || new Date();
    const isAbandoned = abandonedConversations.has(conversationId);

    let actualMessagesPerConversation = messagesPerConversation;
    if (isAbandoned) {
      actualMessagesPerConversation = faker.number.int({ min: 2, max: 3 });
    } else {
      if (Math.random() < 0.3) {
        actualMessagesPerConversation = Math.floor(
          messagesPerConversation * 0.6
        );
      } else if (Math.random() < 0.2) {
        actualMessagesPerConversation = Math.floor(
          messagesPerConversation * 1.5
        );
      }
    }

    let lastMessageTime = conversationCreatedAt.getTime();

    for (let i = 0; i < actualMessagesPerConversation; i++) {
      const isUserMessage = i % 2 === 0;
      const role = isUserMessage ? 'user' : 'assistant';

      const messageGap = isUserMessage
        ? faker.number.int({ min: 5, max: 300 }) * 1000
        : faker.number.int({ min: 2, max: 60 }) * 1000;
      lastMessageTime += messageGap;

      const messageCreatedAt =
        lastMessageTime > Date.now()
          ? new Date(Date.now() - Math.random() * 60 * 1000)
          : new Date(lastMessageTime);

      const content = isUserMessage
        ? faker.helpers.arrayElement(prompts)
        : faker.helpers.arrayElement(responses);

      messageData.push({
        conversationId,
        userId: user._id,
        role,
        content,
        toolCalls:
          role === 'assistant' && faker.datatype.boolean({ probability: 0.3 })
            ? [
                {
                  tool: faker.helpers.arrayElement([
                    'create_task',
                    'list_tasks',
                    'update_task',
                    'delete_task',
                  ]),
                  input: { taskName: faker.lorem.words(3) },
                  result: { success: true },
                },
              ]
            : undefined,
        createdAt: messageCreatedAt,
      });
    }
  }

  // Bulk insert messages in batches
  for (let i = 0; i < messageData.length; i += BATCH_SIZE) {
    const batch = messageData.slice(i, i + BATCH_SIZE);
    const inserted = await ConversationMessageModel.insertMany(batch, {
      ordered: false,
    });
    messages.push(...inserted);
  }

  console.log(`✓ Created ${messages.length} messages`);
  return messages;
}

// Main populate function
async function populateAll(options: PopulateOptions): Promise<void> {
  console.log('\n=== Database Population Started ===\n');
  console.log('Options:', options);
  console.log(`Time range: ${options.daysBack} days back from now\n`);

  // Set seed if provided
  if (options.seed !== undefined) {
    faker.seed(options.seed);
    console.log(`Using seed: ${options.seed}\n`);
  }

  const startTime = Date.now();

  try {
    // Create users with exponential time distribution and activity levels
    const { users, metadata: userMetadata } = await populateUsers(
      options.users,
      options.daysBack
    );
    console.log('');

    // Create todolists with timestamps and activity patterns
    const { todolists, todolistDates, abandonedTodolists } =
      await populateTodolists(
        users,
        userMetadata,
        options.todolistsPerUser,
        options.daysBack
      );
    console.log('');

    // Create tasks with timestamps and abandonment patterns
    const tasks = await populateTasks(
      todolists,
      todolistDates,
      abandonedTodolists,
      options.tasksPerTodolist,
      options.daysBack
    );
    console.log('');

    // Create conversations with timestamps and abandonment patterns
    const {
      conversationIds,
      conversationDates,
      conversationUserMap,
      abandonedConversations,
    } = await populateConversations(
      users,
      userMetadata,
      options.conversationsPerUser,
      options.daysBack
    );
    console.log('');

    // Create messages with sequential timestamps
    const messages = await populateMessages(
      conversationIds,
      conversationDates,
      conversationUserMap,
      abandonedConversations,
      options.messagesPerConversation
    );
    console.log('');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('=== Population Summary ===');
    console.log(`Users: ${users.length}`);
    console.log(`Todolists: ${todolists.length}`);
    console.log(`Tasks: ${tasks.length}`);
    console.log(`Conversations: ${conversationIds.length}`);
    console.log(`Messages: ${messages.length}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Time range: ${options.daysBack} days`);
    console.log('\n✓ Database population completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Error during population:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Parse arguments
    const options = parseArgs();

    // Validate environment
    validateServerEnv(process.env);

    // Connect to database
    console.log('Connecting to database...');
    await connectToDB();
    console.log('✓ Database connected\n');

    // Run population
    await populateAll(options);

    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
