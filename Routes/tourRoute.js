const express=require('express');
const tours=require('./../controllers/tourContoller');
const authController=require('./../controllers/authController');
//const reviewController=require('./../controllers/reviewController');
const reviewRouter=require('./../Routes/reviewRoutes');
const router=express.Router();//middleware for function 







router.use('/:tourId/reviews',reviewRouter);





router.route('/top-5-cheap').get(tours.aliasTopTours,tours.getAlltours);

router.route('/tour-stats').get(tours.getToursStats);
router.route('/monthly-plan/:year').get(
    authController.protect,authController
    .restrictTo('admin','lead-guide','guide'),
    tours.getMonthlyPlan
);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tours.getToursWithin);
// tours-distance?distance=233&center=-40,45&unit=mi
// tours-distance/233/center/-40,45/unit/mi

router.route('/:distances/:latlng/unit/:unit').get(tours.getDistances);

//router.param('id',tours.checkID);
//create a checkBody middleware
// check if body contains the name and price property
// if not, send back 400(bad request)
// add it to the post handler stack
router.route('/')
    .get(tours.getAlltours)
    
    .post(authController.protect,authController.restrictTo('admin','lead-guide'),tours.createTour);
    
    

router.route('/:id')
    .get(tours.getTour)
    .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tours.updateTour)
    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tours.deleteTour);


// router
//     .route('/:tourId/review')
//     .post(authController.protect,authController.restrictTo('user'),reviewController.createReview);

module.exports=router;