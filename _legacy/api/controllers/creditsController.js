const catchAsyncError = require("../middleware/catchAsyncError");
const User = require("../models/userModel");




exports.addUpCredits=catchAsyncError(async(req,res,next)=>{
    const {
        userId,
        credits,
        paymentId,
        paymentStatus      
    } = req.body;


    if(!userId || !credits || !paymentId || !paymentStatus){
        return res.status(400).json({
            success:false,
            message:"Please enter all fields"
        });
    }

    const user=await User.findById(userId);


    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        });
    }


    user.credits+=credits;

    await user.save();


    res.status(200).json({
        success:true,
        user,
        message:"Credits added successfully"
    });

});

