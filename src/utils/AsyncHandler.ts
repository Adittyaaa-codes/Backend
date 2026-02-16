import { Request,Response,NextFunction,RequestHandler} from "express";

const AsyncHandler = (fn:RequestHandler) => (req:Request,res:Response,next:NextFunction) => {
    return Promise.resolve(fn(req,res,next))
    .catch((error) => next(error));
}

export default AsyncHandler;