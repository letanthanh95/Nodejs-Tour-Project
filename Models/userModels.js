const crypto=require('crypto');
const mongoose=require('mongoose');
const validator=require("validator");
const bcrypt=require('bcryptjs');
//name,email,photo,passowrd,passowrd confirm
const userSchema=new mongoose.Schema({
    name:
    {
        type:String,
        required:[true,"you must have the name"],
    },
    email:
    {
        type:String,
        required:[true,"please provide the email"],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'please provide a valid email']
    },
    photo:String,
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'
    },
    password:
    {
        type:String,
        required:[true,'please provide the password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'please confirm the password'],
        validate:{
            //this onnly works on CREATE AND SAVE!!!
            validator:function(el)
            {
                return el===this.password; //abc===abc
            },
            message:'Password are not the same'
        }
    },
    passwordChangAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false,
    }
});

userSchema.pre(/^find/,function(next){
    // this points to the current query
    this.find({active:{$ne:false}});
    next();
});


//pre-hook saving it to the database
userSchema.pre('save',async function(next){
    //only run this function if password was actualy modified
    if (!this.isModified('password')) return next();
    //Hash the password with cost of 12
    this.password=await bcrypt.hash(this.password,12);
    //delete password confirm
    this.passwordConfirm=undefined;
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password')||this.isNew) return next();
    this.passwordChangAt=Date.now();
    next();
});



userSchema.methods.correctPassword=async function(candidatePassword,userPassword)
{
    return await bcrypt.compare(candidatePassword,userPassword);
};

 userSchema.methods.changedPasswordAfter=function(JWTTimestamp){
    if(this.passwordChangAt){
        const changedTimestamp=parseInt(this.passwordChangAt.getTime()/1000,10);
        console.log(changedTimestamp,JWTTimestamp);
        return JWTTimestamp<changedTimestamp;//100<200
    } 
    //false means not changed
    return false;
 };

userSchema.methods.createPasswordResetToken=function(){

    const resetToken=crypto.randomBytes(32).toString('hex');

    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires=Date.now()+10*60*1000;
    return resetToken;
};



const User=mongoose.model('User',userSchema);
module.exports=User;