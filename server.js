const mongoose=require('mongoose');
const app=require('./index');
const dotenv=require('dotenv');
dotenv.config({path:'./config.env'});
const domain='127.0.0.1';

process.on('uncaughtException',err=>{
    console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN ....' );
    console.log(err.name,err.message);
    
    server.close(()=>{
        process.exit(1);
    });
})
console.log(process.env);
dotenv.config({path:'./config.env'});

// const DB=process.env.DATABASE.replace(
//     '<PASSWORD>', 
//     process.env.DATABASE_PASSWORD
 //);
const DB=process.env.DATABASE_LOCAL;




mongoose.connect(DB,{
    useNewUrlParser:true,
   useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology:true //turn off warnings
}).then(()=>{console.log('DB connection successful')});
//create schema

const port=process.env.PORT||3000;
const server=app.listen(port,()=>{
    console.log(`app running in port ${port}...`);
});


// app.listen(port,domain,()=>{
//     console.log(`This app running at http://${domain}:${port}`);
// });
//test

process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log('UNHANDLE REJECTION! SHUTTING DOWN ....' );
    server.close(()=>{
        process.exit(1);
    });
   
});


