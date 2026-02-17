import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';
import { Document } from '../models/document.model';

type UploadedFile = {
    path?: string;
    originalname: string;
    mimetype: string;
    size: number;
};

const uploadDocs = async (req: Request, res: Response) => {
    try {
        const files: UploadedFile[] = (req as Request & { files?: UploadedFile[] }).files ?? [];

        if (!files?.length) {
            throw new ApiError('No files provided', 400);
        }

        const token = req.headers.authorization?.toString().replace('Bearer ', '') ||
            (req as any).cookies?.AccessToken;

        if (!token) {
            throw new ApiError('Missing access token', 401);
        }

        const form = new FormData();

        // Track created document IDs to update status later
        const createdDocIds: string[] = [];
        (req as any)._createdDocIds = createdDocIds;
        
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            throw new ApiError('Unauthorized', 401);
        }

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

            const doc = await Document.create({
                userId: userId,
                fileName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'processing',
            });
            createdDocIds.push(String(doc._id));
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

        // Mark documents as completed on success
        if (createdDocIds.length) {
            await Document.updateMany(
                { _id: { $in: createdDocIds } },
                { $set: { status: 'completed' } }
            );
        }

        // ✅ Clean up temp files
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        res.json(new ApiResponse(true, 'Documents uploaded & indexed', response.data));

    } catch (error: any) {
        // Mark documents as failed on error and clean up
        const files: UploadedFile[] = (req as Request & { files?: UploadedFile[] }).files ?? [];
        for (const file of files || []) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        try {
            // Best-effort status update
            const createdDocIds: string[] = (req as any)._createdDocIds || [];
            if (createdDocIds.length) {
                await Document.updateMany(
                    { _id: { $in: createdDocIds } },
                    { $set: { status: 'failed' } }
                );
            }
        } catch {}

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

        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            throw new ApiError('Unauthorized', 401);
        }

        // const docs = await Document.findById({
        //     userId:userId
        // })

        // console.log(docs)

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

