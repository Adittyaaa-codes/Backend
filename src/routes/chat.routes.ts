import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.ts";
import { chat_ex, chat_qa } from "../controllers/chat.controller.ts";

const router = Router();

router.post('/explain', verifyJWT, chat_ex);
router.post('/qa', verifyJWT, chat_qa);

export default router;
