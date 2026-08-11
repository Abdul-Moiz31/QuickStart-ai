const catchAsyncError = require("../middleware/catchAsyncError");
const Message = require("../models/messageModel");
const Session = require("../models/sessionModel");
const User=require("../models/userModel");

exports.createSession = catchAsyncError(async (req, res, next) => {
    const {
        username,
        email,
        chatbotId
    } = req.body;

    if (!username || !email || !chatbotId) {
        return res.status(400).json({
            success: false,
            message: "Please enter all fields"
        });
    }


    // chatbot exists

    const chatbot = await User.findById(chatbotId);


    if (!chatbot) {
        return res.status(404).json({
            success: false,
            message: "Chatbot not found"
        });
    }




    const session = await Session.create({
        username,
        email,
        chatbotId
    });

    res.status(200).json({
        success: true,
        session,
        message: "Session created successfully"
    });

});


exports.getAllSessions = catchAsyncError(async (req, res, next) => {
    const user=req.user;

    let sessions = await Session.find({ chatbotId: user._id });


    // get last message 
    sessions = await Promise.all(sessions.map(async session => {
        const lastMessage = await Message.findOne({ sessionId: session._id,role:"user" }).sort({ createdAt: -1 });

        return {
            ...session._doc,
            lastMessage: lastMessage ? lastMessage.message : ""
        };

    }));



  




    res.status(200).json({
        success: true,
        sessions
    });

});


exports.getMonthlySessions = catchAsyncError(async (req, res, next) => {
    const user = req.user;

    const sessions = await Session.aggregate([
        {
            $match: { chatbotId: user._id }
        },
        {
            $project: {
                month: { $month: "$createdAt" }
            }
        },
        {
            $group: {
                _id: "$month",
                count: { $sum: 1 }
            }
        }
    ]);

    const data = [
        { month: "January", count: 0 },
        { month: "February", count: 0 },
        { month: "March", count: 0 },
        { month: "April", count: 0 },
        { month: "May", count: 0 },
        { month: "June", count: 0 },
        { month: "July", count: 0 },
        { month: "August", count: 0 },
        { month: "September", count: 0 },
        { month: "October", count: 0 },
        { month: "November", count: 0 },
        { month: "December", count: 0 }
    ];

    sessions.forEach(session => {
        const monthIndex = session._id - 1; 
        data[monthIndex].count = session.count;
    });

    res.status(200).json({
        success: true,
        data
    });
});





// ADMIN ROUTES

exports.getAllSessionsMonthlyByAdmin=catchAsyncError(async(req,res,next)=>{
    const sessions=await Session.aggregate([
        {
            $project:{
                month:{$month:"$createdAt"}
            }
        },
        {
            $group:{
                _id:"$month",
                count:{$sum:1}
            }
        }
    ]);
  
    const data=[
        {month:"January",count:0},
        {month:"February",count:0},
        {month:"March",count:0},
        {month:"April",count:0},
        {month:"May",count:0},
        {month:"June",count:0},
        {month:"July",count:0},
        {month:"August",count:0},
        {month:"September",count:0},
        {month:"October",count:0},
        {month:"November",count:0},
        {month:"December",count:0}
    ];
  
    sessions.forEach(session=>{
        const monthIndex=session._id-1;
        data[monthIndex].count=session.count;
    });
  
    res.status(200).json({
        success:true,
        data
    });
  });


  exports.addMessageToSession=catchAsyncError(async(req,res,next)=>{
    const {sessionId,chatbotId,botMessage,userMessage}=req.body;

    if(!sessionId || !chatbotId || !botMessage || !userMessage){
        return res.status(400).json({
            success:false,
            message:"Please enter all fields"
        });
    }

    const session=await Session.findById(sessionId);


    if(!session){
        return res.status(404).json({
            success:false,
            message:"Session not found"
        });
    }

    const user_message=await Message.create({
        message:userMessage,
        sessionId,
        role:"user",
        chatbotId
    });
  
  
    const bot_message=await Message.create({
        message:botMessage,
        sessionId,
        role:"bot",
        chatbotId
    });

    session.messages.push(user_message);
    session.messages.push(bot_message);

    await session.save();

    res.status(200).json({
        success:true,
        message:"Message added successfully"
    });

});