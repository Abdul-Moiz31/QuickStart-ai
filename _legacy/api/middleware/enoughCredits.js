
const catchAsyncError=require("./catchAsyncError")
const jwt=require("jsonwebtoken")
const User = require("../models/userModel")
const CustomError = require("../utils/errorHandler")

exports.enoughCredits = catchAsyncError(async (req, res, next) => {

    const user=req.user;

    if(user.credits<1){
        return next(new CustomError("Not enough credits to access this resource", 400));
    }

    
   
    next();
  });