import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface ITask extends Document {
  name: string;
  todolist: ObjectId;
  checked: boolean;
  description?: string;
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

// Basic indexes for performance
TaskSchema.index({ owner: 1, todolist: 1 }); // For finding tasks by owner and todolist
TaskSchema.index({ owner: 1, createdAt: -1 }); // For finding recent tasks by owner

export const TaskModel = model<ITask>('task', TaskSchema);
