const express=require('express');
const user=require('./../controllers/userController');
const router = require('./tourRoute');
const authController=require('./../controllers/authController');
const reviewController=require('./../controllers/reviewController');


const route=express.Router();

route.post('/signup',authController.signup);
route.post('/login',authController.login);

route.post('/forgotPassword',authController.forgotPassword);
route.patch('/resetPassword/:token',authController.resetPassword);

route.use(authController.protect);

route.patch('/updateMyPassword',authController.updatePassword);

route.patch('/updateMe',user.updateMe);
route.patch('/deleteMe',user.deleteMe);

route.get('/me',user.getMe,user.getUser);


route.use(authController.restrictTo('admin'));

route.route('/').get(user.getAllUser).post(user.createUser);

route.route('/:id')
    .get(user.getUser)
    .patch(user.updateUser)
    .delete(user.deleteUser);



route
    .route('/:tourId/review')
    .post(authController.restrictTo('user'),reviewController.createReview);


module.exports=route;