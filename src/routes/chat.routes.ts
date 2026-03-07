import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createChat, getChats, getChatMessages, deleteChat } from "../controllers/chat.controller";

const router = Router();

router.post('/', verifyJWT, createChat);
router.get('/', verifyJWT, getChats);
router.get('/:chatId/messages', verifyJWT, getChatMessages);
router.delete('/:chatId', verifyJWT, deleteChat);

export default router;
