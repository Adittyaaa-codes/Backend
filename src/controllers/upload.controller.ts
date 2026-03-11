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
    const files: UploadedFile[] = (req as Request & { files?: UploadedFile[] }).files ?? [];

    if (!files?.length) {
        throw new ApiError('No files provided', 400);
    }

    const token = req.headers.authorization?.toString().replace('Bearer ', '') ||
        (req as any).cookies?.AccessToken;

    if (!token) {
        throw new ApiError('Missing access token', 401);
    }

    const userId = (req as any).user?._id?.toString();
    if (!userId) {
        throw new ApiError('Unauthorized', 401);
    }

    const { subId, chId } = req.params;

    if (!subId || !chId) {
        throw new ApiError('Subject and Chapter are required', 400);
    }

    const createdDocIds: string[] = [];

    try {
        const form = new FormData();

        for (const file of files) {
            if (!file.path || !fs.existsSync(file.path)) {
                throw new ApiError(`File not found: ${file.path}`, 500);
            }

            const buffer = fs.readFileSync(file.path);

            form.append('files', buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });

            const doc = await Document.create({
                userId,
                fileName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                subject: subId,
                chapter: chId,
            });

            createdDocIds.push(doc._id.toString());
        }

        form.append('userId', userId);
        form.append('subject', subId);
        form.append('chapter', chId);

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

        await Document.updateMany(
            { _id: { $in: createdDocIds } },
            { $set: { status: 'completed' } }
        );
    
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        res.json(new ApiResponse(true, 'Documents uploaded & indexed', response.data));

    } catch (error: any) {
        if (createdDocIds.length) {
            await Document.updateMany(
                { _id: { $in: createdDocIds } },
                { $set: { status: 'failed' } }
            ).catch(() => {}); 
        }

        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
        console.error('Upload error details:', error.response?.data);
        console.error('Upload error:', errorMessage);
        
        res.status(error.response?.status || 500).json(new ApiResponse(false, errorMessage));
    }
};

const listDocs = AsyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.toString().replace('Bearer ', '') ||
        (req as any).cookies?.AccessToken;

    if (!token) {
        throw new ApiError('Missing access token', 401);
    }

    try {
        // const response = await axios.get(`${process.env.FASTAPI_URL}/list_docs`, {
        //     headers: { Authorization: `Bearer ${token}` },
        //     timeout: 10000,
        //     validateStatus: () => true, 
        // });

        // if (response.status >= 400) {
        //     throw new ApiError(`FastAPI error: ${response.status}`, response.status);
        // }

        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            throw new ApiError('Unauthorized', 401);
        }

        const docs = await Document.find({
            userId: userId
        })

        console.log(docs)

        res.json(
            new ApiResponse(true, 'Documents listed', docs)
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

