import { Router } from "express";
import {
    getChapters,
    addChapter,
    updateChapter,
    deleteChapter
} from "../controllers/chapters.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get('/get-all/:id', verifyJWT, getChapters);
router.post('/add/:id', verifyJWT, addChapter);
router.put('/update/:id', verifyJWT, updateChapter);
router.delete('/del/:id', verifyJWT, deleteChapter);

export default router;