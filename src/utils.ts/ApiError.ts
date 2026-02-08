class ApiError extends Error{
    data:any;
    statuscode:Number;

    constructor(message: string|undefined, statuscode: Number) {
        super(message) 
        this.statuscode = statuscode;
    }
}

export default ApiError;