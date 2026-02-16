import { User } from "../models/user.model.ts";
import { Request, Response, CookieOptions } from "express";
import AsyncHandler from "../utils/AsyncHandler.ts";
import ApiError from "../utils/ApiError.ts";
import ApiResponse from "../utils/ApiResponse.ts";

const userRegister = AsyncHandler(async (req:Request,res:Response)=>{
    const { username, fullname, email, password } = req.body;

    if (!username || !fullname || !email || !password || [username, fullname, email, password].some((field: string) =>
        field?.trim() === "")) {
        throw new ApiError("All fields are required!!",401);
    }

    const userExist = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (userExist) {
        return res.status(409).json(
            new ApiResponse(false, "User already exists", userExist)
        );
    }

    // const createUser = await User.create({
    //     username,
    //     fullname,
    //     email,
    //     password
    // });

    // if(!createUser){
    //     throw new ApiError("User registration failed",402);
    // }

    // return new ApiResponse(true,"User created successfully",createUser);

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase()
    });

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(true, "User created Successfully", userCreated)
    )
});

const userLogin = AsyncHandler(async (req: Request, res: Response) => {
    const { username, password } = (req.body || {});

    if(!username || !password || username?.trim()==="" || password?.trim()===""){
        throw new ApiError("Username and Password are required",402);
    }

    const userFound = await User.findOne({
        username:username?.trim()
    })

    if(!userFound){
        throw new ApiError("No user found!!,Try signing up",402);
    }

    const passwordCorrect = await userFound.IsPasswordCorrect(password);

    if(!passwordCorrect){
        throw new ApiError("Incorrect Password",404);
    }

    const AccessToken = userFound.generateAccessToken();
    const RefreshToken = userFound.generateRefreshToken();

    userFound.refreshToken = RefreshToken;
    await userFound.save();

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
    };

    const refreshCookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
    };

    const userInfo = await User.findById(userFound._id).select("-refreshToken -password");

        return res
    .status(200)
    .cookie('AccessToken', AccessToken, cookieOptions)
    .cookie('RefreshToken', RefreshToken, refreshCookieOptions)
    .json(
    new ApiResponse(true, 'Login successful!!', { 
      user: userInfo, 
      accessToken: AccessToken, 
      refreshToken: RefreshToken 
        }))
});

interface AuthenticatedRequest extends Request {
  user?: { _id: string };
  tokenData?: any;
}

const userLogout = AsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?._id) {
        throw new ApiError("Not authenticated", 401);
    }
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true },
    );

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
    };

    res
        .clearCookie("RefreshToken", cookieOptions)
        .clearCookie("AccessToken", cookieOptions)
        .json(new ApiResponse(true,"user logged-out successfully"));
});



export { userRegister, userLogin ,userLogout};