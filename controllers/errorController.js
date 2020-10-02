const AppError=require('./../ultils/appError');

const handleCastErrorDB=err=>{
    const message=`invalid ${err.path}:${err.value}.`;
    return new AppError(message,400);
};

const handleJWTError = ()=>new AppError('Invalid token. Please login again',401);
const handleJWTExpiredError = ()=>new AppError('Your token has expired.Please login again',401);

const handleDuplicateFiledsDB=err=>{
    
    const value= err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    console.log(value);

    const message=`Duplicate filed value: ${value}. please use another value!`;
    return new AppError(message,400);
};

const handleValidationErrorDb=err=>{
    const errors=Object.values(err.errors).map(el=>el.message);
    const message=`Invalid input data. ${errors.join('. ')}`;
    return new AppError(message,400);
};

const sendErrorDev=(err,res)=>{
    res.status(err.statusCode).json({
        status:err.status,
        error:err,
        message:err.message,
        stack:err.stack
    });
    //console.log(err.name);
};


const sendErrorProd=(err,res)=>{
    //Operational, trusted error:send message to cline
    if(err.isOperational)
    {
        res.status(err.statusCode).json({
            status:err.status,
            //error:err,
            message:err.message,
        });
        
        //programmng or other unknown error:donot leak error details
    } 
    else{
        //1)log error
            console.log('error',err);
        //2_ send generic message
        res.status(500).json({
            status:'error',
            message:'Something went wrong!'
        })
    }
    
    
};
module.exports=(err,req,res,next)=>{
    
    err.statusCode=err.statusCode||500;//server err
    err.status=err.status||'error';
    
    if(process.env.NODE_ENV==='development'){
        sendErrorDev(err,res)
        
    }else if(process.env.NODE_ENV==='production')
    {
        
        //let error={...err};//destructuring error
        
        if(err.name==='CastError') err=handleCastErrorDB(err);
        if(err.code===11000) err = handleDuplicateFiledsDB(err);
        if(err.name=='ValidationError') err=handleValidationErrorDb(err);
        if(err.name==="JsonWebTokenError") err=handleJWTError();
        if(err.name==="TokenExpiredError") err=handleJWTExpiredError();
        
        sendErrorProd(err,res);
    }

    
};