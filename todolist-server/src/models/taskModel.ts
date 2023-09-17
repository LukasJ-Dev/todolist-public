import mongoose, { Schema, model, Document, ObjectId } from "mongoose";

export interface ITask extends Document {
  name: string;
  todolist: ObjectId;
  checked: boolean;
  description: string;
  owner: ObjectId;
}

const TaskSchema = new Schema<ITask>({
  name: { type: String, required: true },
  checked: { type: Boolean, default: false },
  todolist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "todolist",
    required: true,
  },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
});

export const TaskModel = model<ITask>("task", TaskSchema);
