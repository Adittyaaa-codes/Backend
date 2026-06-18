import { Response } from "express";
import axios from "axios";
import AsyncHandler from "../utils/AsyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { Subject } from "../models/subject.model";
import { Chapter } from "../models/chapters.model";
import { Document } from "../models/document.model";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";


const getSubjects = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id;
    const subjects = await Subject.find({ owner: userId as any });

    return res.status(200).json(new ApiResponse(true, 'Subjects fetched', subjects));
});

const addSubject = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subName, desc } = req.body;
    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id; 

    if (!subName) throw new ApiError("Could not get subject name", 400);

    const subExist = await Subject.findOne({ subName, owner: userId as any });
    if (subExist)
        return res.status(400).json(new ApiResponse(false, "Subject already exists", subExist));

    const subject = await Subject.create({
        subName,
        desc,
        owner: userId as any, 
    });

    return res.status(201).json(new ApiResponse(true, "New Subject Added", subject));
});



const editSubject = AsyncHandler(async(req:AuthenticatedRequest,res:Response)=>{
    const {subName,desc} = req.body;
    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id;

    if(!subName||!desc) throw new ApiError("Could not get subject name or description",402)

    const {id} = req.params;

    const subject = await Subject.findOneAndUpdate(
        { _id: id, owner: userId as any },
        {
            subName,
            desc,
        },
        { new: true }
    );
    
    if (!subject) throw new ApiError("Subject not found or unauthorized", 404);

    return res
    .status(200)
    .json(new ApiResponse(true,"Subject Updated",subject));
})

const delSubject = AsyncHandler(async(req:AuthenticatedRequest,res:Response)=>{
    const {id:subId} = req.params
    if (!req.user) throw new ApiError('Unauthorized', 401);
    const userId = req.user._id;

    const subject = await Subject.findOne({ _id: subId, owner: userId as any });
    if (!subject) throw new ApiError("Subject not found or unauthorized", 404);

    const subName = subject.subName;

    // Cascade delete related records
    const chatIds = await Chat.find({ subjectId: subId, userId: userId as any }).distinct("_id");
    await Message.deleteMany({ chatId: { $in: chatIds } });
    await Chat.deleteMany({ subjectId: subId, userId: userId as any });
    await Document.deleteMany({ subject: subId, userId: userId as any });
    await Chapter.deleteMany({ subject: subId });
    await Subject.deleteOne({ _id: subId, owner: userId as any });

    // Sync deletion with RAG backend — delete all vectors for this subject
    try {
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        const token = (req as any).headers?.authorization || '';
        
        await axios.delete(`${fastApiUrl}/delete_hierarchy`, {
            data: { subject: subName },
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        // Log the error but don't fail the deletion
        console.error('Failed to sync deletion with RAG backend:', error.message);
    }

    return res
    .status(200)
    .json(new ApiResponse(true,"Subject Deleted",null));
})

export {
    getSubjects,
    addSubject,
    editSubject,
    delSubject
}
