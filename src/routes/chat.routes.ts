import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createChat, getChats, getChatMessages, deleteChat, saveMessage } from "../controllers/chat.controller";

const router = Router();

router.post('/create', verifyJWT, createChat);
router.get('/get-all', verifyJWT, getChats);
router.get('/:chatId/messages', verifyJWT, getChatMessages);
router.post('/:chatId/message', verifyJWT, saveMessage);
router.delete('/:chatId', verifyJWT, deleteChat);

export default router;
