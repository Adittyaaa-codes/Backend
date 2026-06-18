import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import AsyncHandler from '../utils/AsyncHandler';
import { Document } from '../models/document.model';

// With memoryStorage, multer adds a `buffer` field to each file instead of `path`
type UploadedFile = Express.Multer.File;

const uploadDocs = async (req: Request, res: Response) => {
    const files: UploadedFile[] = (req as any).files ?? [];

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

    const { subject: subId, chapter: chId } = req.body;

    if (!subId || !chId) {
        throw new ApiError('Subject and Chapter are required', 400);
    }

    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (!FASTAPI_URL) {
        throw new ApiError('Server misconfiguration: FASTAPI_URL is not set', 500);
    }

    const createdDocIds: string[] = [];
    const responses: any[] = [];

    try {
        for (const file of files) {
            // With memoryStorage, file.buffer holds the file content in RAM
            if (!file.buffer || file.buffer.length === 0) {
                throw new ApiError(`Empty file received: ${file.originalname}`, 400);
            }

            // Save document record to MongoDB
            const doc = await Document.create({
                userId,
                fileName: file.originalname,
                filePath: `memory:${file.originalname}`, // no disk path in memory mode
                fileSize: file.size,
                mimeType: file.mimetype,
                subject: subId,
                chapter: chId,
            });

            createdDocIds.push(doc._id.toString());

            // Forward the file buffer directly to FastAPI
            const form = new FormData();
            form.append('file', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
                knownLength: file.buffer.length,
            });
            form.append('subject', subId);
            form.append('chapter', chId);

            console.log(`Forwarding file "${file.originalname}" (${file.size} bytes) to FastAPI...`);

            const response = await axios.post(
                `${FASTAPI_URL}/index`,
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Bearer ${token}`,
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 120000,
                }
            );

            console.log(`FastAPI indexed "${file.originalname}" successfully`);
            responses.push(response.data);
        }

        // Mark all documents as completed
        await Document.updateMany(
            { _id: { $in: createdDocIds } },
            { $set: { status: 'completed' } }
        );

        res.json(new ApiResponse(true, 'Documents uploaded & indexed', responses));

    } catch (error: any) {
        // Mark all created documents as failed
        if (createdDocIds.length) {
            await Document.updateMany(
                { _id: { $in: createdDocIds } },
                { $set: { status: 'failed' } }
            ).catch(() => {});
        }

        const errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message;

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
        const userId = (req as any).user?._id?.toString();
        if (!userId) {
            throw new ApiError('Unauthorized', 401);
        }

        const docs = await Document.find({ userId });

        console.log(docs);

        res.json(new ApiResponse(true, 'Documents listed', docs));

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

    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (!FASTAPI_URL) {
        throw new ApiError('Server misconfiguration: FASTAPI_URL is not set', 500);
    }

    try {
        const response = await axios.delete(
            `${FASTAPI_URL}/delete_docs/${encodeURIComponent(filename)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
                validateStatus: () => true,
            }
        );

        if (response.status >= 400) {
            throw new ApiError(`FastAPI error: ${response.status}`, response.status);
        }

        return res.json(new ApiResponse(true, 'Document deleted', response.data));

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

export { uploadDocs, listDocs, delete_docs };
