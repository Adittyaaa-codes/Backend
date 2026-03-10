import { Response } from 'express';
import AsyncHandler from '../utils/AsyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import { Subject } from '../models/subject.model';
import { Chapter } from '../models/chapters.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const addChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId, chapterName } = req.body;

    const userId = (req as any).user?._id?.toString();

    if (!subjectId || !chapterName) throw new ApiError('subjectId and chapterName required', 400);

    const subject = await Subject.findOne({
        _id: subjectId,
        owner: userId
    });

    if (!subject) throw new ApiError('Subject not found', 404);

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

    const userId = (req as any).user?._id?.toString();

    const subject = await Subject.findOne({ _id: subjectId, owner: userId });
    if (!subject) throw new ApiError('Subject not found', 404);

    const chapters = await Chapter.find({ subject: subjectId })
        .sort({ order: 1 });

    res.json(new ApiResponse(true, 'Chapters fetched', chapters));
});

const updateChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { chapterName, desc } = req.body;

    if (!chapterName) throw new ApiError('chapterName is required', 400);

    const chapter = await Chapter.findByIdAndUpdate(
        id,
        {
            chName: chapterName,
            ...(desc && { desc })
        },
        { new: true }
    );

    if (!chapter) throw new ApiError('Chapter not found', 404);

    res.json(new ApiResponse(true, 'Chapter updated', chapter));
});

const deleteChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const userId = (req as any).user?._id?.toString();

    const chapter = await Chapter.findById(id);
    if (!chapter) throw new ApiError('Chapter not found', 404);

    const subject = await Subject.findOne({ _id: chapter.subject, owner: userId });
    if (!subject) throw new ApiError('Unauthorized', 403);

    await chapter.deleteOne();

    res.json(new ApiResponse(true, 'Chapter deleted'));
});

export {
    addChapter,
    getChapters,
    updateChapter,
    deleteChapter
}