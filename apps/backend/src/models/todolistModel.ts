import mongoose, { Schema, model, Document, ObjectId } from "mongoose";

export interface ITodolist extends Document {
    name: string,
    owner: ObjectId
};

const TodolistSchema = new Schema<ITodolist>({
    name: {type: String, required: true},
    owner: {type: mongoose.Schema.Types.ObjectId, ref: "user", required: true}
});

export const TodolistModel = model<ITodolist>("todolist", TodolistSchema);