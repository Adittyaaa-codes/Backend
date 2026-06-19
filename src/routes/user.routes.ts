import { Router } from "express";
import {
    userRegister,
    userLogin,
    userLogout,
    getCurrentUser,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/logout").post(verifyJWT, userLogout);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;

