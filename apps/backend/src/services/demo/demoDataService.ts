import { todolistService } from '../todolist/todolistService';
import { taskService } from '../task/taskService';

/**
 * Service for creating demo account sample data
 */
export class DemoDataService {
  /**
   * Create sample data for a demo account
   * Creates 3-4 todolists with 10-15 tasks total, showcasing various features
   */
  async createDemoData(userId: string): Promise<void> {
    // Create todolists
    const workTodolist = await todolistService.createTodolist({
      name: 'Work Projects',
      userId,
    });

    const personalTodolist = await todolistService.createTodolist({
      name: 'Personal Tasks',
      userId,
    });

    const shoppingTodolist = await todolistService.createTodolist({
      name: 'Shopping List',
      userId,
    });

    const learningTodolist = await todolistService.createTodolist({
      name: 'Learning Goals',
      userId,
    });

    const workTodolistId = workTodolist.todolist._id.toString();
    const personalTodolistId = personalTodolist.todolist._id.toString();
    const shoppingTodolistId = shoppingTodolist.todolist._id.toString();
    const learningTodolistId = learningTodolist.todolist._id.toString();

    // Helper to get dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Work Projects - 4 tasks
    await taskService.createTask({
      name: 'Review pull request',
      todolistId: workTodolistId,
      userId,
      description: 'Review the new feature implementation',
      dueDate: today,
      priority: 'high',
      tags: ['code-review', 'urgent'],
    });

    await taskService.createTask({
      name: 'Team standup meeting',
      todolistId: workTodolistId,
      userId,
      description: 'Daily standup at 10 AM',
      dueDate: tomorrow,
      priority: 'medium',
      tags: ['meeting'],
      isRecurring: true,
      recurrenceType: 'daily',
      recurrenceInterval: 1,
    });

    const deployTask = await taskService.createTask({
      name: 'Deploy to production',
      todolistId: workTodolistId,
      userId,
      description: 'Deploy the latest version after testing',
      dueDate: nextWeek,
      priority: 'high',
      tags: ['deployment', 'production'],
    });

    // Create subtask for deploy task
    await taskService.createTask({
      name: 'Run integration tests',
      todolistId: workTodolistId,
      userId,
      description: 'Ensure all tests pass before deployment',
      dueDate: nextWeek,
      priority: 'high',
      parentTaskId: deployTask.task._id.toString(),
      tags: ['testing'],
    });

    // Personal Tasks - 4 tasks
    await taskService.createTask({
      name: 'Go to the gym',
      todolistId: personalTodolistId,
      userId,
      description: 'Leg day workout',
      dueDate: today,
      priority: 'medium',
      tags: ['health', 'fitness'],
      isRecurring: true,
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
    });

    await taskService.createTask({
      name: 'Read "Clean Code" chapter 5',
      todolistId: personalTodolistId,
      userId,
      description: 'Continue reading the book',
      dueDate: tomorrow,
      priority: 'low',
      tags: ['reading', 'learning'],
    });

    await taskService.createTask({
      name: 'Call mom',
      todolistId: personalTodolistId,
      userId,
      description: 'Weekly check-in call',
      dueDate: nextWeek,
      priority: 'medium',
      tags: ['family'],
      isRecurring: true,
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
    });

    // Completed task - use today's date to avoid validation issues
    const completedTask = await taskService.createTask({
      name: 'Finish project proposal',
      todolistId: personalTodolistId,
      userId,
      description: 'Submit the proposal document',
      dueDate: today,
      priority: 'high',
      tags: ['work', 'completed'],
    });
    // Mark as completed
    await taskService.updateTask(completedTask.task._id.toString(), userId, {
      checked: true,
    });

    // Shopping List - 3 tasks
    const groceriesTask = await taskService.createTask({
      name: 'Buy groceries',
      todolistId: shoppingTodolistId,
      userId,
      description: 'Milk, eggs, bread, vegetables',
      dueDate: tomorrow,
      priority: 'medium',
      tags: ['shopping', 'food'],
    });

    // Create subtasks for groceries
    await taskService.createTask({
      name: 'Buy milk',
      todolistId: shoppingTodolistId,
      userId,
      description: '2% milk, 1 gallon',
      dueDate: tomorrow,
      priority: 'medium',
      parentTaskId: groceriesTask.task._id.toString(),
      tags: ['shopping'],
    });

    await taskService.createTask({
      name: 'Buy eggs',
      todolistId: shoppingTodolistId,
      userId,
      description: 'Dozen large eggs',
      dueDate: tomorrow,
      priority: 'medium',
      parentTaskId: groceriesTask.task._id.toString(),
      tags: ['shopping'],
    });

    await taskService.createTask({
      name: 'Buy hardware supplies',
      todolistId: shoppingTodolistId,
      userId,
      description: 'Screws, nails, and tools',
      dueDate: nextWeek,
      priority: 'low',
      tags: ['shopping', 'hardware'],
    });

    // Learning Goals - 3 tasks
    await taskService.createTask({
      name: 'Learn React hooks',
      todolistId: learningTodolistId,
      userId,
      description: 'Study useState, useEffect, and custom hooks',
      dueDate: nextWeek,
      priority: 'high',
      tags: ['learning', 'react'],
    });

    const typescriptTask = await taskService.createTask({
      name: 'Complete TypeScript course',
      todolistId: learningTodolistId,
      userId,
      description: 'Finish the advanced TypeScript course on Udemy',
      dueDate: nextWeek,
      priority: 'medium',
      tags: ['learning', 'typescript'],
    });

    // Create subtask for TypeScript course
    await taskService.createTask({
      name: 'Watch module 5 videos',
      todolistId: learningTodolistId,
      userId,
      description: 'Advanced types and generics',
      dueDate: tomorrow,
      priority: 'medium',
      parentTaskId: typescriptTask.task._id.toString(),
      tags: ['learning'],
    });

    await taskService.createTask({
      name: 'Set up Docker environment',
      todolistId: learningTodolistId,
      userId,
      description: 'Learn Docker basics and containerization',
      dueDate: nextWeek,
      priority: 'low',
      tags: ['learning', 'docker', 'devops'],
    });
  }
}

// Export singleton instance
export const demoDataService = new DemoDataService();
