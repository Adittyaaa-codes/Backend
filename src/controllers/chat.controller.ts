import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import AsyncHandler from "../utils/AsyncHandler";
import { Request,Response } from "express";

const chat_ex = AsyncHandler(async (req:Request, res:Response) => {
    const {query} = req.body;

    const bearerHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.AccessToken as string | undefined;
    const token = bearerHeader?.startsWith("Bearer ")
        ? bearerHeader.split(" ")[1]
        : cookieToken;

    // console.log("chat_ex → token:", token); 

    if (!token) {
        throw new ApiError("Unauthorized: missing access token", 401);
    }

    const response = await fetch(`${process.env.FASTAPI_URL}/chat/explain`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query:query
        })
    });

    if(!response){
        throw new ApiError("No Response!!",402)
    }

    const text = await response.text();

    return res.status(200).json(
        new ApiResponse(true, "Got response from LLM", { text })
    );
});

const chat_qa = AsyncHandler(async (req:Request, res:Response) => {
    const {query} = req.body;

    const bearerHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.AccessToken as string | undefined;
    const token = bearerHeader?.startsWith("Bearer ")
        ? bearerHeader.split(" ")[1]
        : cookieToken;

    // console.log("chat_ex → token:", token); 

    if (!token) {
        throw new ApiError("Unauthorized: missing access token", 401);
    }

    const response = await fetch(`${process.env.FASTAPI_URL}/chat/qa`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query:query
        })
    });

    if(!response){
        throw new ApiError("No Response!!",402)
    }

    const text = await response.text();

    return res.status(200).json(
        new ApiResponse(true, "Got response from LLM", { text })
    );
});


export {chat_ex,chat_qa};
