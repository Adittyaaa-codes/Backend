import { Response } from "express";
import AsyncHandler from "../utils/AsyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { Subject } from "../models/subject.model";
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

    await Subject.deleteOne({
        _id: subId,
        owner: userId as any
    });

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
