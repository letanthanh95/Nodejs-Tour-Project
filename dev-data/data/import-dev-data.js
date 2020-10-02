const mongoose=require('mongoose');
const fs=require('fs');
const dotenv=require('dotenv');
dotenv.config({path:'./config.env'});
const Tour=require('./../../Models/tourmodels')
const User=require('./../../Models/userModels')
const Review=require('./../../Models/reviewModel')

console.log(process.env);
// const DB=process.env.DATABASE.replace(
//     '<PASSWORD>', 
//     process.env.DATABASE_PASSWORD
//  )
const DB=process.env.DATABASE_LOCAL;




mongoose.connect(DB,{
    useNewUrlParser:true,
   useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology:true //turn off warnings
}).then(()=>{console.log('DB connection successful')});
//read json file
const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));


const users=JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));

const reviews=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));






//import data to databse
const importData=async()=>{
    try{
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reviews);
        console.log('Data successfully loaded!');
    }catch(err){
        console.log(err);
    }
};
// DELETE ALL DATA FROM DB
const deleteData=async()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data sccessfully deleted!');
        process.exit();
    }catch(err){
        console.log(err);
    }
}
if(process.argv[2]==='--import')
{
    importData();
}else if (process.argv[2]==='--delete')
{

    deleteData();
}
console.log(process.argv);// the array of running this node process

