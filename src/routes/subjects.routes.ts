import { Router } from "express";
import {
    getSubjects,
    addSubject,
    editSubject,
    delSubject
} from "../controllers/subject.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get('/get-all-subjects', verifyJWT, getSubjects);
router.post('/add', verifyJWT, addSubject);
router.put('/edit/:id', verifyJWT, editSubject);
router.delete('/delete/:id', verifyJWT, delSubject);

export default router;