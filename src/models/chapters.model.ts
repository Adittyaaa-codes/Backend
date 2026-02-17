import mongoose, { Schema } from "mongoose";

export interface IChapter extends mongoose.Document{
    chName:string,
    resources:string,
    owner:Schema.Types.ObjectId
    chapters:Schema.Types.ObjectId
}

const chSchema = new mongoose.Schema<IChapter>({
    chName:{
        type:String,
        required:true,
        unique:true
    },
    resources:[
        {
            type:Schema.Types.ObjectId,
            ref:"Document"
        }
    ],
},{timestamps:true})

export const Subject = mongoose.model<IChapter>("Chapter",chSchema);
