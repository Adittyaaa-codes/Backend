import { Response } from 'express';
import axios from 'axios';
import AsyncHandler from '../utils/AsyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import { Subject } from '../models/subject.model';
import { Chapter } from '../models/chapters.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const addChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: subjectId } = req.params;
    const { chapterName } = req.body;

    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id.toString();

    if (!subjectId || !chapterName) throw new ApiError('subjectId and chapterName required', 400);

    const subject = await Subject.findOne({
        _id: subjectId as any,
        owner: userId as any
    });

    if (!subject) throw new ApiError('Subject not found', 404);

    // Check if chapter with same name already exists in this subject
    const existingChapter = await Chapter.findOne({
        chName: chapterName,
        subject: subjectId as any
    });

    if (existingChapter) {
        throw new ApiError('Chapter already exists in this subject', 400);
    }

    const chapterCount = await Chapter.countDocuments({ subject: subjectId });

    const chapter = await Chapter.create({
        chName: chapterName,
        subject: subjectId,
        order: chapterCount
    });

    subject.chapters.push(chapter._id as any);
    await subject.save();

    res.status(201).json(new ApiResponse(true, 'Chapter added', chapter));
});

const getChapters = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: subjectId } = req.params;

    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id.toString();

    const subject = await Subject.findOne({ _id: subjectId as any, owner: userId as any });
    if (!subject) throw new ApiError('Subject not found', 404);

    const chapters = await Chapter.find({ subject: subjectId as any })
        .sort({ order: 1 });

    res.json(new ApiResponse(true, 'Chapters fetched', chapters));
});

const updateChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { chapterName, desc } = req.body;

    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id.toString();

    if (!chapterName) throw new ApiError('chapterName is required', 400);

    const chapter = await Chapter.findById(id);
    if (!chapter) throw new ApiError('Chapter not found', 404);

    const subject = await Subject.findOne({ _id: chapter.subject as any, owner: userId as any });
    if (!subject) throw new ApiError('Unauthorized to update this chapter', 403);

    chapter.chName = chapterName;
    if (desc !== undefined) {
        chapter.desc = desc;
    }
    await chapter.save();

    res.json(new ApiResponse(true, 'Chapter updated', chapter));
});

const deleteChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id.toString();

    const chapter = await Chapter.findById(id);
    if (!chapter) throw new ApiError('Chapter not found', 404);

    const subject = await Subject.findOne({ _id: chapter.subject as any, owner: userId as any });
    if (!subject) throw new ApiError('Unauthorized', 403);

    const subjectName = subject.subName;
    const chapterName = chapter.chName;

    await chapter.deleteOne();

    // Sync deletion with RAG backend — delete vectors for this specific chapter
    try {
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        const token = (req as any).headers?.authorization || '';
        
        await axios.delete(`${fastApiUrl}/delete_hierarchy`, {
            data: { subject: subjectName, chapter: chapterName },
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        // Log the error but don't fail the deletion
        console.error('Failed to sync chapter deletion with RAG backend:', error.message);
    }

    res.json(new ApiResponse(true, 'Chapter deleted'));
});

export {
    addChapter,
    getChapters,
    updateChapter,
    deleteChapter
}