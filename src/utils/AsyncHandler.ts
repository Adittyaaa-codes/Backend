import { Request,Response,NextFunction,RequestHandler} from "express";

const AsyncHandler = <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => any) => 
(req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req as T, res, next))
    .catch((error) => next(error));
}

export default AsyncHandler;