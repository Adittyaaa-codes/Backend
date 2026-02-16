import { Router } from "express";
import {
    userRegister,
    userLogin,
    userLogout,
} from "../controllers/user.controller.ts";
import { verifyJWT } from "../middlewares/auth.middleware.ts";

const router = Router();

router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/logout").post(verifyJWT, userLogout);

export default router;

