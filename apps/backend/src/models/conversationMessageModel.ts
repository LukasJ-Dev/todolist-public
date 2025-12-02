import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface IConversationMessage extends Document {
  conversationId: string;
  userId: ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    tool: string;
    input: Record<string, unknown>;
    result: unknown;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: [true, 'Role is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    toolCalls: {
      type: [
        {
          tool: String,
          input: Schema.Types.Mixed,
          result: Schema.Types.Mixed,
        },
      ],
      default: [],
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

// Compound index for efficient queries
ConversationMessageSchema.index({ conversationId: 1, userId: 1, createdAt: 1 });

export const ConversationMessageModel = model<IConversationMessage>(
  'conversationMessage',
  ConversationMessageSchema
);
