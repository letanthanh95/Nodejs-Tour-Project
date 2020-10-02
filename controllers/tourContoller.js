const express=require('express');
const fs=require('fs');
const { runInNewContext } = require('vm');
const Tour=require('./../Models/tourmodels');
const APIFeature=require('./../ultils/apiFeatures');
const catchAsync=require('./../ultils/catchAsync');
const AppError = require('../ultils/appError');
const factory=require('./handlerFactory');
const router = require('../Routes/reviewRoutes');

exports.aliasTopTours=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='-ratingAverage,price';
    req.query.field='name,price,ratingAverage,summary,difficulty';
    
    next();
   
};

exports.getAlltours=factory.getAll(Tour);
exports.getTour=factory.getOne(Tour);
exports.createTour=factory.createOne(Tour);
exports.updateTour=factory.updateOne(Tour);
exports.deleteTour=factory.deleteOne(Tour);




exports.getToursStats=catchAsync(async (req,res,next)=>{
    const stats= await Tour.aggregate([
        {
            $match:{ratingAverage:{$gte:4.5}}
        },
        {
            $group:
            {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort:{avgPrice:1}
        },
        {
            $match: {_id:{$ne:'easy'}}

        }            
      
    ]);
    res.status(200).json({
        status:'success',
        data:{
            stats
        }
    });
    // try{
    //     //we can manipulate the data
    //     const stats= await Tour.aggregate([
    //         {
    //             $match:{ratingAverage:{$gte:4.5}}
    //         },
    //         {
    //             $group:
    //             {
    //                 _id: { $toUpper: '$difficulty' },
    //                 numTours: { $sum: 1 },
    //                 numRatings: { $sum: '$ratingsQuantity' },
    //                 avgRating: { $avg: '$ratingsAverage' },
    //                 avgPrice: { $avg: '$price' },
    //                 minPrice: { $min: '$price' },
    //                 maxPrice: { $max: '$price' }
    //             }
    //         },
    //         {
    //             $sort:{avgPrice:1}
    //         },
    //         {
    //             $match: {_id:{$ne:'easy'}}

    //         }            
          
    //     ]);
    //     res.status(200).json({
    //         status:'success',
    //         data:{
    //             stats
    //         }
    //     });
        
    // }catch(err)
    // {
    //     res.status(404).json({
    //         status:'fail',
    //         message:err
    //     });
    // }
});

exports.getMonthlyPlan=catchAsync(async (req,res,next)=>{
    const year=req.params.year*1;
        const plan=await Tour.aggregate([
            {
                //basicallyy deconstruct an array field from the info documents then output one document for 
                //each element of the array
                $unwind:'$startDates'
            },
            {
                //select query
                $match:{
                    startDates:{
                        $gte:new Date(`${year}-01-01`),
                        $lte:new Date(`${year}-12-31`),
                    }
                }
            },
                {
                    $group:{
                        _id: {$month: '$startDates'},
                        numTourStarts:{$sum: 1},
                        tours:{$push:'$name'}
                    }
                },
                {
                    $addFields:{month:'$_id'}
                },
                {
                    $project:{
                        _id:0
                    }
                },
                {
                    $sort:{numTourStarts:-1}
                },
                {
                    $limit:12
                }
                
            
        ]);
        res.status(200).json({
            status:'success',
            data:{
                plan,
            }
        });
        console.log(plan);
    // try{
    //     const year=req.params.year*1;
    //     const plan=await Tour.aggregate([
    //         {
    //             //basicallyy deconstruct an array field from the info documents then output one document for 
    //             //each element of the array
    //             $unwind:'$startDates'
    //         },
    //         {
    //             //select query
    //             $match:{
    //                 startDates:{
    //                     $gte:new Date(`${year}-01-01`),
    //                     $lte:new Date(`${year}-12-31`),
    //                 }
    //             }
    //         },
    //             {
    //                 $group:{
    //                     _id: {$month: '$startDates'},
    //                     numTourStarts:{$sum: 1},
    //                     tours:{$push:'$name'}
    //                 }
    //             },
    //             {
    //                 $addFields:{month:'$_id'}
    //             },
    //             {
    //                 $project:{
    //                     _id:0
    //                 }
    //             },
    //             {
    //                 $sort:{numTourStarts:-1}
    //             },
    //             {
    //                 $limit:12
    //             }
                
            
    //     ]);
    //     res.status(200).json({
    //         status:'success',
    //         data:{
    //             plan,
    //         }
    //     });
    //     console.log(plan);
    // }catch(err){
    //     res.status(404).json({
    //         status:'fail',
    //         message:err
    //     });
    // }
});

exports.getToursWithin=catchAsync( async(req,res,next)=>{
    const {
        distance,latlng,unit
    }=req.params;
    const [lat,lng]=latlng.split(',');
    const radius = unit==='mi'?distance/3963.2:distance/6378.1;
    if(!lat || !lng){
        next(new AppError('Please Provide latitude and longtitude in the format lat,lng',400));
    }
    const tours=await Tour.find({startLocation:{$geoWithin:{$centerSphere:[[lng,lat],radius]}}
    });
    res.status(200).json({
       status:'success' ,
       results:tours.length,
       data:{
           data:tours
       }
    });
});

exports.getDistances=catchAsync(async(req,res,nect)=>{
    const {
        latlng,unit
    }=req.params;
    const [lat,lng]=latlng.split(',');
    const multilier=unit==="mi"?0.00062137:0.001;
    if(!lat || !lng){
        next(new AppError('Please Provide latitude and longtitude in the format lat,lng',400));
    }   
    const distances=await Tour.aggregate([
        {
            $geoNear:{
                near:{
                    type:'Point',
                    coordinates:[lng*1,lat*1]
,
                },
                distanceField:'distance',
                distanceMultiplier:multilier
            }
        },
        {
            $project:{
                distance:1,
                name:1
            }
        }
    ]);
    res.status(200).json({
        status:'success' ,
        
        data:{
            data:distances
        }
     });
 });
















//Comment ignore!!!






// const tours=JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );
// exports.checkID=(req,res,next,val)=>{
//     console.log(`Tour id is:${id}`);
//     if (req.params.id*1 >tours.length)
//     {
//         return res.status(404).json({
//             status:'fail',
//             message:'invalid ID'
//         });
//     }
//     next();
// };
// exports.checkBody=(req,res,next)=>{
//     if(!req.body.name||!req.body.price){
//         return res.status(400).json({
//             status:'fail',
//             message:'missing name or price'
//         })
//     }
//     next();
// }


// exports.getAlltours = catchAsync(async (req,res,next)=>
// {

//     const features=new APIFeature(Tour.find(),req.query)
//          .filter()
//          .sorting()
//          .limitField()
//          .paginate();
//          const tours=await features.query;
//         //const tours=await Tour.find();
//         //send response
//         res.status(200).json({
//         status:'OK',
//         results:tours.length,
//         data:{
//             tours
//          }
//     });
//     // try {
//     //     //build query
//     //     // const queryObj={...req.query};//structuring using 3 dots(contain values and key)
//     //     // const excludedFields=['page','sort','limit','field'];
//     //     // excludedFields.forEach(el=>delete queryObj[el]);
//     //     // console.log(req.query,queryObj);

//     //     // //advanced filtering
//     //     // let queryStr=JSON.stringify(queryObj);
//     //     // queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match=>`$${match}`);
//     //     // console.log(JSON.parse(queryStr));
//     //     // let query=Tour.find(JSON.parse(queryStr));

//     //     //  Sorting
//     //     // if (req.query.sort){
//     //     //     const sortBy=req.query.sort.split(',').join(' ');
//     //     //     console.log(sortBy);
//     //     //     query=query.sort(req.query.sort);
//     //     //     //sort=('price ratingAverage')
//     //     // }else{
//     //     //     query=query.sort('-createdAt');
//     //     // }




//     //     //paginaiton
//     //     // const page=req.query.page*1||1;
//     //     // const limit=req.query.limit*1||100;
//     //     // const skip=(page-1)*limit;
//     //     // query=query.skip(skip).limit(limit);//skip the values before we actually start querying

//     //     // if(req.query.page){
//     //     //     const numTours=await Tour.countDocuments();
//     //     //     if(skip>=numTours)throw new Error('This page does not exist');
//     //     // }

//     //     //const query=Tour.find(queryObj);//.where('duration).equals(5).where('difficluty').equals('easy')
//     //     //const query=Tour.find()
//     //     //.where('duration).equals(5).where('difficluty').equals('easy')
//     //     //execute query
//     //      const features=new APIFeature(Tour.find(),req.query)
//     //      .filter()
//     //      .sorting()
//     //      .limitField()
//     //      .paginate();
//     //      const tours=await features.query;
//     //     //const tours=await Tour.find();
//     //     //send response
//     //     res.status(200).json({
//     //     status:'OK',
//     //     results:tours.length,
//     //     data:{
//     //         tours
//     //      }
//     // });
//     // } catch (err){
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message:err
//     //     });
//     // }
// });
// exports.getTour=catchAsync(async (req,res,next)=>{
//     // console.log(req.params);
//     // const id=req.params.id*1;//convert string to number in javascripts
//     // // const tour=tours.find(el=>el.id===id);
//     // //if (id>tours.length)
    
    
//     // res.status(200).json({
//     //     status:'success',
//     //     // result:tours.length,
//     //     // data:{
            
//     //     //     tours:tour,
//     //     // }
//     // });
//     const tour= await Tour.findById(req.params.id).populate('reviews');
//         //Tour.findOne({ _id: req.params.id})

//         if(!tour)
//         {
//             return next(new AppError('No tour found with the ID',404));
//         }
//         res.status(200).json({
//             status:'success',
//             data:{
//                 tour
//             }
//         });
//     // try{
//     //     const tour= await Tour.findById(req.params.id);
//     //     //Tour.findOne({ _id: req.params.id})
//     //     res.status(200).json({
//     //         status:'success',
//     //         data:{
//     //             tour
//     //         }
//     //     });
//     // }catch (err){
//     //     res.status(404).json({
//     //         status:'fail',
//     //         message:err
//     //     });
//     // }
// });

/* in order ti get rid try catch block we simply wrapped our asynchronous function
inside of the catchAsync funct=>will return a new annonymous function*/


// exports.createTour=catchAsync(async (req,res,next)=>{//pass above async function
//     // const newId=tours[tours.length-1].id+1;
//     // const newTours=Object.assign({id:newId},req.body);
//     // tours.push(newTours);
//     // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`,JSON.stringify(tours),err=>{

//     //this line for mongoose
//     // const newTour=new Tour({})
//     // newTour.save()

//     const newTour=await Tour.create(req.body);
//     res.status(201).json({
//         status:'success',
//         data:{
//             tour:newTour,
//             }
//          });
        
//     // try{
//     //     const newTour=await Tour.create(req.body);
//     //      res.status(201).json({
//     //         status:'success',
//     //         data:{
//     //             tour:newTour,
//     //         }
//     //      });
//     //      //console.log(newTour);
//     // }catch(err){
//     //     res.status(400).json({
//     //         status:'fail',
//     //         message:err
//     //     });
//     //     //console.log(err);
//     // }
    
    
//     //});
    
// });
// //req.body that response back to client
// // exports.updateTour=catchAsync(async (req,res,next)=>{
// //     const tours=await Tour.findByIdAndUpdate(req.params.id,req.body,{
// //         new: true,
// //         runValidators:true
// //     })
// //     if(!tour)
// //     {
// //         return next(new AppError('No tour found with the ID',404));
// //     }
// //     res.status(200).json({
// //      status:'success',
// //      data:tours
// //  });
// // //    try {
// // //        const tours=await Tour.findByIdAndUpdate(req.params.id,req.body,{
// // //            new: true,
// // //            runValidators:true
// // //        })
// // //        res.status(200).json({
// // //         status:'success',
// // //         data:tours
// // //     });
// // //    }catch (err){
// // //        res.status(404).json({
// // //            status:'fail',
// // //            message:err
// // //        });
// // //    }
    
    
// // });






// exports.deleteTour=catchAsync(async (req,res,next)=>{
//     //const id=req.params.id*1;
//     const tour=await Tour.findByIdAndDelete(req.params.id);
//     if(!tour)
//     {
//         return next(new AppError('No tour found with the ID',404));
//     }
//         res.status(204).json({
//             status:'success',
//             data:'null'
//         });
//     // try{
//     //     const tour=await Tour.findByIdAndDelete(req.params.id);
//     //     res.status(204).json({
//     //         status:'success',
//     //         data:'null'
//     //     });
//     // }catch(err){
//     //     res.status(404).json({
//     //         status:'fail',
//     //         message:err
//     //     });
//     // }
    
// });
