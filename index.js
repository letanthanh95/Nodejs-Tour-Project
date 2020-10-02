const express=require('express');
const fs=require('fs');
const morgan=require('morgan');
const tourRouter=require('./Routes/tourRoute');
const userRouter=require('./Routes/userRoute');
const AppError=require('./ultils/appError');
const globalErrorHandler=require('./controllers/errorController');
const ratelimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const reviewRouter=require('./Routes/reviewRoutes');


const app=express();




//1st middleware
//set security HTTP headers
app.use(helmet());
//Development login
if(process.env.NODE_ENV==='development')
{
    app.use(morgan('dev'));
}
const limiter=ratelimit({
    max: 100,
    windowMs: 60*60*1000,
    message:'Too many requests from this IP, please try again in an hour',
});

app.use('/api',limiter);

// BODY parser,reading data from body into req.body
app.use(express.json({limit:'10kb'}));
//Data sanitization against NoSql query injection
app.use(mongoSanitize());
//Data sanitization against XSS 
app.use(xss());
//Prevent parameter pollution
app.use(hpp({
    whitelist:[
        'duration'
    ]
}));
//serving static files

app.use(express.static(`${__dirname}/public`));

// app.use((req,res,next)=>
// {
//     console.log('hello from middleware');
//     next();
// });
app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    next();
});


// Route Hnadlers



// app.get('/api/v1/tours',getAlltours);

// app.get('/api/v1/tours/:id',getTour);


// app.post('/api/v1/tours',createTour);

// app.patch("/api/v1/tours/:id",updateTour);


// app.delete('/api/v1/tours/:id',deleteTour);


// route
// app.use('/api/v1/tours',tourRouter);
// app.use('/api/v1/users',userRouter);



app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status:'fail',
    //     message:`cant find ${req.originalUrl} on this server!`
    // });
    // const err=new Error(`cant find ${req.originalUrl} on this server!`);
    // err.status='fail';
    // err.statusCode=404;
    next(new AppError(`cant find ${req.originalUrl} on this server!`,404));
});
app.use(globalErrorHandler);

//start server
module.exports=app;

