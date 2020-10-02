const mongoose=require('mongoose');
const slugify=require('slugify');
const validator=require('validator');
const User=require('./userModels');
const tourSchema=new mongoose.Schema({
    name: {
        type:String,
        required:[true,'A tour must have a name'],
        unique:true,
        trim:true,
        maxlength:[40,'A tour name must have less or equal than 40 characters'],
        minlength:[10,'A tour name must have greater or equal than 10 characters'],
        //validate: [validator.isAlpha,'Tour name must be only contain the character']
    },
    slug:String,
    duration:{
        type:Number,
        required:[true,'A tour must have a duration']
    },
    maxGroupSize:{
        type: Number,
        required:[true,"A tour must have a group size"]
    },
    difficulty:{
        type:String,
        required:[true,'A tour must have a difficulty'],
        enum:{
            values:['easy','medium','difficult'],
            message:'Difficulty is either: easy,medium,difficult'
        }
    },
    ratingQuantity:{
        type:Number,
        default:0
    },
    ratingAverage: {
        type:Number,
        default:4.5,
        min:[1,'rating must be above 1.0'],
        max:[5,'rating must be below 5.0'],
        set:val=>Math.round(val*10)/10//

    },
    price: {
        type:Number,
        required:[true,'a tour must have a price']
    },
    priceDiscount:{
        type:Number,
        validate:{
            validator:function(val){
                //this only points to current doc on NEW docs creation
                return val<this.price;
            },
            message:'Disconut price({VALUE}) should be below regular price'
        }
        
    },
    summary:
    {
        type:String,
        trim: true,
        required:[true,'A tour must have a description']
    },
    description:{
        type:String,
        trim:true
    },
    imageCover:{
        type:String,
        require:[true,'A tour must have a cover image']
    },
    images:[String],
    CreateAt:{
        type:Date,
        default:Date.now(),
        select:false 
    },
    startDates:[Date],
    secrectTour:{
        type:Boolean,
        default:false
    },
    startLocation:{
        //GeoJson
        type:{
            type:String,
            default:'Point',
            enum:['Point'],
        },
        coordinates:[Number],
        address:String,
        description:String

    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            description:String,
            day:Number
        }
    ],
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ],
    reviews:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'Review'
        }
        
    ]
    
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});//that is not a part of query so we cannot retrive data like query

tourSchema.index({price:1})//sorting
tourSchema.index({startLocation: '2dsphere'})


tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7
});
//DOCUMENT MIDDLEWARE:runs befor .save() and .create()
// DOCUMENT MIDDLEWARE that can act on the currently processed document
//we can have mmiddleware before or after a certain the event in the case of doc middleware the event is usually the save event
tourSchema.pre('save',function(next){
    this.slug=slugify(this.name,{lower:true});//next function
    next();
});
//virtual populate
tourSchema.virtual('review',{
    ref:"Review",
    foreignField:'tour',
    localField:'_id'
});
 

// tourSchema.pre('save',async function(next){
//     const guidesPromimses=this.guides.map(async id=>await User.findById(id));
//     this.guides=await Promise.all(guidesPromimses);
//     next();
// });

// tourSchema.pre('save',function(next){
//     console.log('will save document...');
//     next();
// })//pre save hook

// tourSchema.post('save',function(doc,next){
//     console.log(doc);
//     next();
// })
//Query Middleware
// Qurey middleware allows us to run the function before the query executed
//query middleware=>'find'=>this keyword will now point at the current query not the current docs
//create secrect tour
tourSchema.pre(/^find/,function(next){//all the string start with find
    //tourSchema.pre('find',function(next))
    this.find({secrectTour:{$ne:true}});
    this.start=Date.now();
    next();
});

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select:'-__v -passwordChangAt'
        });
    next();
})

tourSchema.post(/^find/,function(docs,next){//all the string start with find
    console.log(`query Hook ${Date.now()-this.start} ms`);
    //console.log(docs);
    
    next();
});




//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate',function(next){
//     this.pipeline().unshift({$match:{secrectTour:{$ne:true}}});
//     console.log(this.pipeline());
//     next();
// });
const Tour=mongoose.model('Tour',tourSchema);

// const testTour=new Tour({
//     name:'The Park hiker',
//     rating:4.7,
//     price: 497
// });
// testTour.save().then(doc=>{
//     console.log(doc);
// }).catch(err=>{
//     console.log("Error");
// })
module.exports=Tour;
