import mongoose, { Schema } from "mongoose";

export interface ISubject extends mongoose.Document{
    subName:string,
    desc:string
    globalResources:string,
    owner:Schema.Types.ObjectId
    chapters:Schema.Types.ObjectId[]
}

const subSchema = new mongoose.Schema<ISubject>({
    subName:{
        type:String,
        required:true,
        unique:true
    },
    desc:{
        type:String,  
    },
    globalResources:[
        {
            type:Schema.Types.ObjectId,
            ref:"Document"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    chapters:[
        {
        type:Schema.Types.ObjectId,
        ref:"Chapter"
        }
    ]

},{timestamps:true})

export const Subject = mongoose.model<ISubject>("Subject",subSchema);
