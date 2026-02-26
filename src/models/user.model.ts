import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

//model->subject->chapter

export interface IUser {
    fullname: string;
    username: string;
    email: string;
    profilePic: string;
    password: string;
    refreshToken: string,
    APIkey: string;
    role?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface IUserMethods {
    IsPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
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
    refreshToken: {
        type: String
    },
    APIkey:{
        type:String,
    },
    role: {
        type: String,
        default: 'user'
    },
},{timestamps:true})

//midleware 
userSchema.pre("save", async function (this: HydratedDocument<IUser>) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

//custom methods for userSchema
userSchema.methods.IsPasswordCorrect = async function(password:string) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    const secret = process.env.ACCESS_SECRET_KEY;

    if (!secret) {
        throw new Error('ACCESS_SECRET_KEY is not defined in environment variables');
    }

    return jwt.sign({
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
            role: this.role
        }, secret,{algorithm: "HS256"});
};

userSchema.methods.generateRefreshToken = function() {
    const secret = process.env.REFRESH_SECRET_KEY;

    if (!secret) {
        throw new Error('REFRESH_SECRET_KEY is not defined in environment variables');
    }

   return jwt.sign({
            _id: this._id,
            jti: randomBytes(16).toString("hex")
        }, secret,{algorithm: "HS256"});

}

export const User = mongoose.model<IUser, UserModel>("User", userSchema);

