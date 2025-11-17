import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface ITask extends Document {
  name: string;
  todolist: ObjectId;
  checked: boolean;
  description?: string;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  parentTaskId?: ObjectId;
  nextDueDate?: Date;
  tags: string[];
  subtasks: ObjectId[];
  parentTask?: ObjectId;
  owner: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [200, 'Task name cannot exceed 200 characters'],
      minlength: [1, 'Task name must be at least 1 character'],
    },
    checked: {
      type: Boolean,
      default: false,
    },
    todolist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'todolist',
      required: [true, 'Todolist reference is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Task description cannot exceed 1000 characters'],
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (this: ITask, value: Date) {
          if (!value) return true;
          // Allow past dates for updates, but not for new tasks
          return value >= new Date(Date.now() - 24 * 60 * 60 * 1000); // Allow up to 1 day in past
        },
        message: 'Due date cannot be more than 1 day in the past',
      },
    },
    startDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
      index: true,
    },
    recurrenceType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function (this: ITask) {
        return this.isRecurring;
      },
      validate: {
        validator: function (this: ITask, value: string) {
          // Allow null/undefined when not recurring
          if (!this.isRecurring && (value === null || value === undefined)) {
            return true;
          }
          // When recurring, value must be one of the enum values
          return ['daily', 'weekly', 'monthly', 'yearly'].includes(value);
        },
        message:
          'Recurrence type must be one of: daily, weekly, monthly, yearly',
      },
    },
    recurrenceInterval: {
      type: Number,
      default: 1,
      min: [1, 'Recurrence interval must be at least 1'],
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
    },
    nextDueDate: {
      type: Date,
      index: true,
    },
    tags: {
      type: [String],
      trim: true,
      lowercase: true,
      maxlength: [50, 'Each tag cannot exceed 50 characters'],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Maximum 10 tags allowed',
      },
    },
    subtasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'task',
      },
    ],
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Owner is required'],
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Enhanced indexes for performance
TaskSchema.index({ owner: 1, todolist: 1 }); // For finding tasks by owner and todolist
TaskSchema.index({ owner: 1, createdAt: -1 }); // For finding recent tasks by owner
TaskSchema.index({ owner: 1, dueDate: 1 }); // For due date queries
TaskSchema.index({ owner: 1, priority: 1 }); // For priority queries
TaskSchema.index({ owner: 1, isRecurring: 1 }); // For recurring queries
TaskSchema.index({ owner: 1, tags: 1 }); // For tag queries
TaskSchema.index({ owner: 1, parentTask: 1 }); // For subtask queries
TaskSchema.index({ dueDate: 1, checked: 1 }); // For overdue queries
TaskSchema.index({ nextDueDate: 1 }); // For recurring generation

export const TaskModel = model<ITask>('task', TaskSchema);
