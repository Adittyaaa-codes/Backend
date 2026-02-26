import { Response } from 'express';
import AsyncHandler from '../utils/AsyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import { Subject } from '../models/subject.model.ts';
import { Chapter } from '../models/chapters.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const addChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId, chName } = req.body;

    const userId = (req as any).user?._id?.toString();

    if (!subjectId || !chName) throw new ApiError('subjectId and chName required', 400);

    const subject = await Subject.findOne({
        _id: subjectId,
        owner: userId
    });

    if (!subject) throw new ApiError('Subject not found', 404);

    const chapterCount = await Chapter.countDocuments({ subject: subjectId });

    const chapter = await Chapter.create({
        chName,
        subject: subjectId,
        order: chapterCount
    });

    subject.chapters.push(chapter._id as any);
    await subject.save();

    res.status(201).json(new ApiResponse(true, 'Chapter added', chapter));
});

const getChapters = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId } = req.params;

    const userId = (req as any).user?._id?.toString();

    const subject = await Subject.findOne({ _id: subjectId, owner: userId });
    if (!subject) throw new ApiError('Subject not found', 404);

    const chapters = await Chapter.find({ subject: subjectId })
        .populate('resources')
        .sort({ order: 1 });

    res.json(new ApiResponse(true, 'Chapters fetched', chapters));
});

const reorderChapters = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { order } = req.body as { order: { id: string; order: number }[] };

    if (!Array.isArray(order)) throw new ApiError('order must be an array', 400);

    const bulkOps = order.map(item => ({
        updateOne: {
            filter: { _id: item.id },
            update: { $set: { order: item.order } }
        }
    }));

    await Chapter.bulkWrite(bulkOps);

    res.json(new ApiResponse(true, 'Chapters reordered'));
});

const deleteChapter = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { chapterId } = req.params;

    const chapter = await Chapter.findByIdAndDelete(chapterId);
    if (!chapter) throw new ApiError('Chapter not found', 404);

    await Subject.updateOne(
        { _id: chapter.subject },
        { $pull: { chapters: chapterId } }
    );

    res.json(new ApiResponse(true, 'Chapter deleted'));
});

export {
    addChapter,
    getChapters,
    reorderChapters,
    deleteChapter
}