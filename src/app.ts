import express,{Express,Request,Response, urlencoded} from "express";
import cookieParser from "cookie-parser";
import { url } from "node:inspector";
const app = express();

app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static('public'));

export default app