import express,{Express,Request,Response, urlencoded} from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.ts";
import chatRouter from "./routes/chat.routes.ts";
import uploadRouter from "./routes/upload.routes.ts";
import multer from "multer"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

const upload = multer();

// Routes
app.use("/api/users",upload.none(), userRouter);
app.use("/api/chat",upload.none(), chatRouter);
app.use("/api/upload", uploadRouter);

export default app