import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../config/upload.config";
import { uploadDocs, listDocs, delete_docs } from "../controllers/upload.controller";

const router = Router();

router.post('/docs/:subId/:chId', verifyJWT, upload.array('files', 10), uploadDocs);
router.get('/list_docs', verifyJWT, listDocs);
router.delete('/delete_docs', verifyJWT, delete_docs);

export default router;
