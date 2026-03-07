import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChat extends Document {
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId | null;
  title: string;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", default: null, index: true },
  title: { type: String, default: "" },
  summary: { type: String, default: "New conversation" }
},{ timestamps: true });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
