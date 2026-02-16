// upload.controller.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';

const uploadDocs = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files?.length) {
            throw new ApiError('No files provided', 400);
        }

        const token = req.headers.authorization?.toString().replace('Bearer ', '') ||
            (req as any).cookies?.AccessToken;

        if (!token) {
            throw new ApiError('Missing access token', 401);
        }

        const form = new FormData();

        // ✅ diskStorage → read from disk path
        for (const file of files) {
            if (!file.path || !fs.existsSync(file.path)) {
                throw new ApiError(`File not found: ${file.path}`, 500);
            }

            const buffer = fs.readFileSync(file.path);
            console.log(`📄 ${file.originalname} → ${buffer.length} bytes`);

            form.append('files', buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
        }

        const response = await axios.post(
            `${process.env.FASTAPI_URL}/upload_docs`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        // ✅ Clean up temp files
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        res.json(new ApiResponse(true, 'Documents uploaded & indexed', response.data));

    } catch (error: any) {
        // Clean up on error
        const files = req.files as Express.Multer.File[];
        for (const file of files || []) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        console.error('Upload error:', error.message);
        res.status(500).json(new ApiResponse(false, error.message));
    }
};

const listDocs = AsyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.toString().replace('Bearer ', '') ||
        (req as any).cookies?.AccessToken;

    if (!token) {
        throw new ApiError('Missing access token', 401);
    }

    try {
        const response = await axios.get(`${process.env.FASTAPI_URL}/list_docs`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
            validateStatus: () => true, 
        });

        if (response.status >= 400) {
            throw new ApiError(`FastAPI error: ${response.status}`, response.status);
        }

        res.json(
            new ApiResponse(true, 'Documents listed', response.data)
        );

    } catch (err: any) {
        console.error('❌ /list_docs error:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            data: err.response?.data,
        });

        throw new ApiError(err.message || 'Failed to list documents', 500);
    }
});

const delete_docs = AsyncHandler(async (req: Request, res: Response) => {
    let filename = 
    (req.body as any)?.filename ||           
    (req.query as any)?.filename ||        
    (req.params as any)?.filename;           

    if (Array.isArray(filename)) filename = filename[0];

    if (!filename || typeof filename !== 'string') {
        throw new ApiError('Filename required (send as body.filename, query ?filename=, or param)', 400);
    }

    const token =
        req.headers.authorization?.toString().replace('Bearer ', '') ||
        (req as any).cookies?.AccessToken;

    if (!token) {
        throw new ApiError('Missing access token', 401);
    }

    try {
        const response = await axios.delete(
            `${process.env.FASTAPI_URL}/delete_docs/${encodeURIComponent(filename)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
                validateStatus: () => true,
            }
        );

        if (response.status >= 400) {
            throw new ApiError(`FastAPI error: ${response.status}`, response.status);
        }

        return res.json(
            new ApiResponse(true, 'Document deleted', response.data)
        );
    } catch (err: any) {
        console.error('❌ /delete_docs error:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            data: err.response?.data,
        });

        throw new ApiError(err.message || 'Failed to delete document', 500);
    }
});




export { uploadDocs, listDocs, delete_docs }

