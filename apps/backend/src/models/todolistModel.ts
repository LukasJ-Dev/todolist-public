import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface ITodolist extends Document {
  name: string;
  owner: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number; // Virtual field
}

const TodolistSchema = new Schema<ITodolist>(
  {
    name: {
      type: String,
      required: [true, 'Todolist name is required'],
      trim: true,
      maxlength: [100, 'Todolist name cannot exceed 100 characters'],
      minlength: [1, 'Todolist name must be at least 1 character'],
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
TodolistSchema.index({ owner: 1, createdAt: -1 }); // For finding todolists by owner, sorted by creation date

// Pre-remove middleware to handle cascade delete
TodolistSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      // Delete all tasks in this todolist
      await mongoose.model('task').deleteMany({ todolist: this._id });
      next();
    } catch (error) {
      next(error as Error);
    }
  }
);

export const TodolistModel = model<ITodolist>('todolist', TodolistSchema);
