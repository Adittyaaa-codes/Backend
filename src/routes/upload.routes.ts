import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.ts";
import { upload } from "../config/upload.config.ts";
import { uploadDocs,listDocs,delete_docs} from "../controllers/upload.controller.ts";

const router = Router();

router.post('/docs', verifyJWT, upload.array('files', 10), uploadDocs);
router.get('/list_docs', verifyJWT, listDocs);
router.delete('/delete_docs', verifyJWT, delete_docs);

export default router;
