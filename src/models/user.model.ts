import mongoose from 'mongoose';

export interface IUser extends mongoose.Document{
    fullname:string,
    username:string,
    email:string,
    profilePic:string,
    password:string,
    APIkey:string,
    createdAt:Date,
    updatedAt:Date
}

const userSchema = new mongoose.Schema<IUser>({
    fullname:{
        type:String,
    },
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    profilePic:{
        type:String
    },
    password:{
        type:String,
        required:true
    },
    APIkey:{
        type:String,
        required:true
    }
},{timestamps:true})

export const User = mongoose.model<IUser>("User",userSchema)