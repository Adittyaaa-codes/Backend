// src/models/document.model.ts
import mongoose from 'mongoose';

interface IDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    status: 'processing' | 'completed' | 'failed';
    ragIndexId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new mongoose.Schema<IDocument>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    ragIndexId: String
}, { timestamps: true });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
