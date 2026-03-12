import express, { Express, Request, Response ,NextFunction} from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";
import chatRouter from "./routes/chat.routes";
import uploadRouter from "./routes/upload.routes";
import subjectsRouter from "./routes/subjects.routes";
import chaptersRouter from "./routes/chapters.routes";
import multer from "multer";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({
    origin: ['https://studybot99.onrender.com'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

const upload = multer();

// Routes
app.use("/api/users",upload.none(), userRouter);
app.use("/api/chats",upload.none(), chatRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/chapters", chaptersRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.statuscode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
});

export default app