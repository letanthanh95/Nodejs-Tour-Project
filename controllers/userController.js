const User=require('./../Models/userModels');
const APIFeature=require('./../ultils/apiFeatures');
const catchAsync=require('./../ultils/catchAsync');
const AppError = require('../ultils/appError');
const factory=require('./handlerFactory');

const filterObj=(obj,...allowedFields)=>{
    const newobj={};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el)) newObj[el];
    });
    return newobj;
};

exports.getMe=(req,res,next)=>{
    req.params.id=req.user.id;
    next();
};


exports.deleteMe=catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
        status:'success',
        data:null
    });
});
exports.getAllUser=catchAsync(async(req,res)=>{
    const users=await User.find();
        //const tours=await Tour.find();
        //send response
        res.status(200).json({
        status:'OK',
        results:users.length,
        data:{
            users
         }
    });
});

exports.updateMe=catchAsync(async(req,res,next)=>{
    // 1) create error if user POST password data
    if (req.body.password||req.body.passwordConfirm)
    {
        return next(new AppError('this route is not for password updates.Please use/updateMyPassword',400));
    }
    //2) fitered out unwanted fields names that are not allowed to be updated
    const fillteredBody=filterObj(req.body,'name','email');
    //3) update user document
    const updatedUser=await User.findByIdAndUpdate(req.user.id,fillteredBody,{
        new:true,
        runValidators:true
    });
   
    res.status(200).json({
        status:'success',
        data:{
            user:updatedUser
        }
    });
});




// exports.createUser=(req,res)=>{
//     res.status(500).json({
//         status:'error',
//         message:'this route is not yet defined'
//     });
// };


// exports.updateUser=(req,res)=>{
//     res.status(500).json({
//         status:'error',
//         message:'this route is not yet defined'
//     });
// };
exports.updateUser=factory.updateOne(User);//do not update password with this

// exports.deleteUser=(req,res)=>{
//     res.status(500).json({
//         status:'error',
//         message:'this route is not yet defined'
//     });
// };

exports.deleteUser=factory.deleteOne(User);
exports.createUser=factory.createOne(User);
exports.getUser=factory.getOne(User);
exports.getAllUser=factory.getAll(User);