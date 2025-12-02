import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface IUserMemory extends Document {
  userId: ObjectId;
  category: 'preference' | 'fact' | 'pattern' | 'context';
  key: string; // e.g., "task_priority_preference", "work_schedule"
  value: string; // e.g., "prefers high priority tasks first", "works in the morning"
  confidence: number; // 0-1, how certain we are about this memory
  source: string; // conversationId or 'system' or 'manual'
  lastUpdated: Date;
  accessCount: number; // how often this memory has been retrieved
  embedding?: number[]; // for semantic search (optional, for future RAG)
  createdAt: Date;
  updatedAt: Date;
}

const UserMemorySchema = new Schema<IUserMemory>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'User ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: ['preference', 'fact', 'pattern', 'context'],
      required: [true, 'Category is required'],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Key is required'],
      trim: true,
      maxlength: [100, 'Key cannot exceed 100 characters'],
      index: true,
    },
    value: {
      type: String,
      required: [true, 'Value is required'],
      trim: true,
      maxlength: [500, 'Value cannot exceed 500 characters'],
    },
    confidence: {
      type: Number,
      required: true,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
      default: 0.8,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: undefined,
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

// Compound indexes for efficient queries
UserMemorySchema.index({ userId: 1, category: 1 });
UserMemorySchema.index({ userId: 1, key: 1 }, { unique: true }); // One memory per key per user
UserMemorySchema.index({ userId: 1, lastUpdated: -1 });
UserMemorySchema.index({ userId: 1, accessCount: -1 });

export const UserMemoryModel = model<IUserMemory>(
  'userMemory',
  UserMemorySchema
);
