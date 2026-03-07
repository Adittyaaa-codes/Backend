import mongoose, { Schema, Document, Types } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ["user","assistant"], required: true },
  content: { type: String, required: true }
},{ timestamps: true });

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
