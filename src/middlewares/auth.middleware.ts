import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.ts";
import AsyncHandler from "../utils/AsyncHandler.ts";
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { User } from "../models/user.model.ts";

interface AccessPayload extends JwtPayload {
  _id: string;
  email?: string;
  username?: string;
  fullname?: string;
  role?: string;
}

const verifyJWT = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Prefer Authorization Bearer header, fallback to cookie AccessToken
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
        const token = bearerToken || req.cookies?.AccessToken;
        
        if (!token) {
            throw new ApiError("Authentication required", 402);
        }
        
        const secret = process.env.ACCESS_SECRET_KEY;
        if (!secret) {
            throw new ApiError("ACCESS_SECRET_KEY is not configured", 500);
        }

        let decoded: AccessPayload;

        try {
            decoded = jwt.verify(token, secret) as AccessPayload;
        } catch (error: unknown) {
            if (error instanceof TokenExpiredError) {
                throw new ApiError("Access token expired", 402);
            }
            if (error instanceof JsonWebTokenError) {
                throw new ApiError("Invalid access token", 401);
            }
            throw new ApiError("Token verification failed", 401);
        }
        
        const user = await User.findById(decoded._id).select("-password");
        
        if (!user) {
            throw new ApiError("User not found", 403);
        }
    
        (req as any).user = user;
        (req as any).tokenData = decoded;
        
        next();
    } catch (error: any) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(error?.message || "Authentication failed", 500);
    }
});

export {verifyJWT};
