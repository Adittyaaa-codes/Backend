import mongoose, { Schema } from "mongoose";

export interface ISubject extends mongoose.Document{
    subName:string,
    resources:string,
    owner:Schema.Types.ObjectId
}

const subSchema = new mongoose.Schema<ISubject>({
    subName:{
        type:String,
        required:true,
        unique:true
    },
    resources:[
        {
            type:String,
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

export const Subject = mongoose.model<ISubject>("Subject",subSchema);
