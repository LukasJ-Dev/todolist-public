import { Schema, model, Document } from 'mongoose';

export interface IGlobalSettings extends Document {
  restrictions: {
    aiDisabled?: boolean;
    createTodolistsDisabled?: boolean;
    createTasksDisabled?: boolean;
    loginDisabled?: boolean;
    registerDisabled?: boolean;
  };
  limits: {
    maxTodolists?: number;
    maxTasks?: number;
    maxAIMessages?: number;
  };
  updatedAt: Date;
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    restrictions: {
      type: {
        aiDisabled: { type: Boolean, default: false },
        createTodolistsDisabled: { type: Boolean, default: false },
        createTasksDisabled: { type: Boolean, default: false },
        loginDisabled: { type: Boolean, default: false },
        registerDisabled: { type: Boolean, default: false },
      },
      default: {},
    },
    limits: {
      type: {
        maxTodolists: { type: Number, min: 0 },
        maxTasks: { type: Number, min: 0 },
        maxAIMessages: { type: Number, min: 0 },
      },
      default: {},
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Ensure only one document exists
GlobalSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      restrictions: {},
      limits: {},
    });
  }
  return settings;
};

export const GlobalSettingsModel = model<IGlobalSettings>(
  'globalsettings',
  GlobalSettingsSchema
);

