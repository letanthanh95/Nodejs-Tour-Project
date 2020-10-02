class APIFeature {
    constructor(query,queryString)//a special method that is automatically called when an object of a class is created.
    {
        this.query=query;
        this.queryString=queryString;
    }
    filter()
    {
        const queryObj={...this.queryString};//structuring using 3 dots(contain values and key)
        const excludedFields=['page','sort','limit','field'];
        excludedFields.forEach(el=>delete queryObj[el]);
        //console.log(req.query,queryObj);

        //advanced filtering
        let queryStr=JSON.stringify(queryObj);
        queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match=>`$${match}`);
        console.log(JSON.parse(queryStr));

        this.query.find(JSON.parse(queryStr));
        return this;//entire obj
        
    }
    sorting()
    {
        if (this.queryString.sort){
            const sortBy=this.queryString.sort.split(',').join(' ');
            console.log(sortBy);
            this.query=this.query.sort(this.queryString.sort);
            //sort=('price ratingAverage')
        }else{
            this.query=this.query.sort('-createdAt');
        }
        return this;
    }
    limitField(){
        if (this.queryString.fields)
        {
            const fields=this.queryString.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }else{
            this.query=this.query.select('-__v');
        }
        return this;
    }
    paginate()
    {
        const page=this.queryString.page*1||1;
        const limit=this.queryString.limit*1||100;
        const skip=(page-1)*limit;
        this.query=this.query.skip(skip).limit(limit);//skip the values before we actually start querying

        return this;
    }
}
module.exports=APIFeature;