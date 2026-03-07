import { Request, Response, CookieOptions } from "express";
import mongoose from "mongoose";
import AsyncHandler from "../utils/AsyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { Subject } from "../models/subject.model";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";


const getSubjects = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = (req as any).user?._id?.toString();
    const subjects = await Subject.find({ owner: userId });

    return res.status(200).json(new ApiResponse(true, 'Subjects fetched', subjects));
});

const addSubject = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subName, desc } = req.body;
    const userId = (req as any).user?._id; 

    if (!subName) throw new ApiError("Could not get subject name", 400);

    const subExist = await Subject.findOne({ subName, owner: userId });
    if (subExist)
        return res.status(400).json(new ApiResponse(false, "Subject already exists", subExist));

    const subject = await Subject.create({
        subName,
        desc,
        owner: userId, 
    });

    console.log("Saved subject owner:", subject.owner);

    return res.status(201).json(new ApiResponse(true, "New Subject Added", subject));
});



const editSubject = AsyncHandler(async(req:AuthenticatedRequest,res:Response)=>{
    const {subName,desc} = req.body;

    if(!subName||!desc) throw new ApiError("Could not get subject name or description",402)

    const {id} = req.params;

    const subject = await Subject.findByIdAndUpdate(
        id,
        {
            subName,
            desc,
        },
        { new: true }
    );
    return res
    .status(200)
    .json(new ApiResponse(true,"Subject Updated",subject));
})

const delSubject = AsyncHandler(async(req:AuthenticatedRequest,res:Response)=>{
    const subId = req.params

    await Subject.deleteOne({
        _id:subId
    });

    return res
    .status(200)
    .json(new ApiResponse(true,"Subject Subject Deleted",null));
})

export {
    getSubjects,
    addSubject,
    editSubject,
    delSubject
}

