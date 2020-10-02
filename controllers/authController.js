const {promisify}=require('util');
const jwt=require('jsonwebtoken');
const User=require('./../Models/userModels');
const Apperror=require('./../ultils/appError');
const catchAsync=require('./../ultils/catchAsync');
const AppError = require('./../ultils/appError');
const email = require('./../ultils/email');
const sendEmail = require('./../ultils/email');
const crypto=require('crypto');

const signToken=id=>{
    return jwt.sign({id},process.env.JWT_SECRECT,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
};

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);
    const cookieOptions={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        //secure:true,
        httpOnly:true
    };
    
    if (process.env.NODE_ENV==='production') cookieOptions.secure=true;
    res.cookie('jwt',token,cookieOptions);
    console.log(res.cookie);
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    });
}

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser=await User.create(req.body);
    createSendToken(newUser,201,res);
    
});

exports.login=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;
    //1 check email and password exist
    if(!email||!password)
    {
        return next(new Apperror('Please provide email and password',400));
    }
    //2 check if user exists && password is coreect
    const user=await User.findOne({email}).select('+password');
    const correct=await user.correctPassword(password,user.password);

    if(!user||!correct)
    {
        return next(new Apperror('Incorrect email or password',401));
    }

    //3 if everything ok,send token to client

    createSendToken(user,200,res);
     
});

exports.protect= catchAsync(async(req,res,next)=>{
    //1) getting to token and check of its there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token=req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new Apperror('you are not logged in! please log in to get access',401));
    }
    //2) verification token
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRECT);
    
    //3) check if user still exists
    const CurrentUser=await User.findById(decoded.id);
    if(!CurrentUser) {
        return next(new Apperror('the user belonging to this token does no longer exist',401));
    }




    //4) check if user change password after the token was issued

    if(CurrentUser.changedPasswordAfter(decoded.iat)){
        return next(new Apperror('User recently changed password! please log in again',401));
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user=CurrentUser;
    next();
});


exports.restrictTo=(...role)=>{
    return(req,res,next)=>{
        //roles['admin',...,]
        if(!role.includes(req.user.role)){
            return next(new AppError('you do not have permission to perform this action',403));
        }
        next();
    };
};

exports.forgotPassword=catchAsync(async(req,res,next)=>{
    //1) get user based on posted email
    const user =await User.findOne({email:req.body.email});
    if(!user){
        return next(new AppError('there is no user with email address',404));
    }
    //2) generate the random reset token
    const resetToken=user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});

    //3) send it to user email
    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message=`Forgot your password? Submit PATCH request with your new password and passwordConfirm to: ${resetURL}.\nif you didnot forget your
    password,please ignore this email! `;
    console.log(resetURL, message)

    try{    
    await sendEmail({
        email:user.email,
        subject:'Your password reset token (valid for 10 min)',
        message
    });
    console.log("sent")
    res.status(200).json({
        status:'success',
        message:'Token sent to email'
    });
    }catch(err){
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({validateBeforeSave:false});
        return next(new AppError('There was an error sending the email.Try again later',500));
    }
});

exports.resetPassword=catchAsync(async (req,res,next)=>{
    //1) get user based in the token

    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});
    
    //2) if token has not expired and there is user set the new password
    if(!user){
        return next(new AppError("Token iss invalid or expired",400));
    }
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();

    //3) update changePasswprdAt property for the user


    //4) log the user in send JWT
    createSendToken(user,200,res);
});
exports.updatePassword=catchAsync(async(req,res,next)=>{
    //1) get user from collection

    const user=await User.findById(req.user.id).select('+password');
    //2)check if posted current password is correct
    const usercorrect=user.correctPassword(req.body.passwordConfirm,user.password);
    if(!usercorrect)
    {
        return next( new AppError("Your current password is wrong",401))
    }


    //3) if so, update password
    user.password=req,body.password;
    user.passwordConfirm=req,body.passwordConfirm;
    await user.save();
    

    //4) log user in send JWT

    createSendToken(user,200,res);
});