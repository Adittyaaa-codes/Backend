import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import AsyncHandler from "../utils/AsyncHandler";
import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";
import mongoose from "mongoose";

const createChat = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError("Unauthorized", 401);
  const { subjectId, chapterId } = req.body || {};
  if (!subjectId) throw new ApiError("subjectId required", 400);
  const chat = await Chat.create({ userId: new mongoose.Types.ObjectId(userId), subjectId, chapterId: chapterId || null, title: "", summary: "New conversation" });
  return res.status(200).json(new ApiResponse(true, "chat created", chat));
});

const getChats = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError("Unauthorized", 401);
  const { subjectId, chapterId } = req.query as { subjectId?: string; chapterId?: string };
  const filter: any = { userId: userId };
  if (subjectId) filter.subjectId = subjectId;
  if (chapterId) filter.chapterId = chapterId;
  const chats = await Chat.find(filter).sort({ updatedAt: -1 });
  return res.status(200).json(new ApiResponse(true, "chats", chats));
});

const getChatMessages = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError("Unauthorized", 401);
  const { chatId } = req.params as { chatId: string };
  if (!chatId) throw new ApiError("chatId required", 400);
  const messages = await Message.find({ chatId, userId }).sort({ createdAt: 1 });
  return res.status(200).json(new ApiResponse(true, "messages", messages));
});

const deleteChat = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new ApiError("Unauthorized", 401);
  const { chatId } = req.params as { chatId: string };
  if (!chatId) throw new ApiError("chatId required", 400);
  const chat = await Chat.findOne({ _id: chatId, userId });
  if (!chat) throw new ApiError("not found", 404);
  await Message.deleteMany({ chatId, userId });
  await Chat.deleteOne({ _id: chatId });
  return res.status(200).json(new ApiResponse(true, "deleted", null));
});

export { createChat, getChats, getChatMessages, deleteChat };
