const User = require("../models/userModel");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const { generateToken } = require("../utils/chatbotToken");
const Session = require("../models/sessionModel");
const CustomError = require("../utils/errorHandler");
const { sendEmail } = require("../utils/sendMail");
require("dotenv").config();

// register a user
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const {
    name,
    email,
    password,
    picture,
    bussinessName,
    bussinessDescription,
    bussinessCategory,
  } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  // token for user to access the chatbot and other services

  const chatbot_token = await generateToken();

  // Create a new user
  const user = await User.create({
    name,
    email,
    password,
    // picture,
    bussinessName,
    bussinessCategory,
    bussinessDescription,
    chatbot_token,
  });

  // Send token in cookie
  console.log(user);
  sendToken(user, 200, res, "User registered successfully");
});
// login a user
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email and password is entered by user
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter email & password",
    });
  }

  // finding user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid Email or Password",
    });
  }

  // check if password is correct or not
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return res.status(401).json({
      success: false,
      message: "Invalid Email or Password",
    });
  }

  // send token in cookie
  sendToken(user, 200, res, (message = "User logged in successfully"));
});

// logout user
exports.logoutUser = catchAsyncError(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(0),
    path: "/",
    secure: true,
    sameSite: "None",
  });

  // Set Cache-Control header to prevent caching
  res.setHeader("Cache-Control", "no-store");

  console.log("Cookie cleared.");
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// load user profile
exports.loadUserProfile = catchAsyncError(async (req, res, next) => {
  // Get the user ID from the request parameters or authentication token
  const userId = req.params.userId || req.user._id;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  // Send response with user's profile
  res.status(200).json({
    success: true,
    user,
  });
});

// add business details
exports.addBussinessDetails = catchAsyncError(async (req, res, next) => {
  const { question, answer } = req.body;
console.log(req.body)
  const user = req.user;
  const bussinessDetails = user.bussinessDetails;

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  if (bussinessDetails.length >= 15) {
    return res.status(400).json({
      success: false,
      message: "Details limit reached.You can't add more details",
    });
  }

  bussinessDetails.push({ question, answer });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Bussiness details added successfully",
  });
});

exports.deleteBussinessDetails = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  const bussinessDetails = user.bussinessDetails;

  const index = bussinessDetails.findIndex(
    (bussinessDetail) => bussinessDetail._id === id
  );

  if (index > -1) {
    bussinessDetails.splice(index, 1);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Bussiness details deleted successfully",
  });
});

// Return the users details  by finding through the chatbot_token

exports.findChatbotUsingToken = catchAsyncError(async (req, res) => {
  const { token } = req.query;

  const user =await User.findOne({ chatbot_token:token });

  if (!user) {
    throw new CustomError("Invalid Token", 400);
  }

  const {
    bussinessName,
    bussinessCategory,
    bussinessDescription,
    bussinessDetails,
    _id
  } = user;

  res.status(200).json({
    data:{
      bussinessName,
      bussinessCategory,
      bussinessDescription,
      bussinessDetails,
      id:_id
    },
    message:"Chatbot Details"
  })
});

// Generate  new token for chatbot and replace the old token

exports.generateNewToken = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  const token = await generateToken();

  user.chatbot_token = token;

  await user.save();

  res.status(200).json({
    success: true,
    message: "New token generated successfully",
  });
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});

exports.getUsersMonthly = catchAsyncError(async (req, res, next) => {
  const users = await User.aggregate([
    {
      $match: { role: "user" },
    },
    {
      $project: {
        month: { $month: "$createdAt" },
      },
    },
    {
      $group: {
        _id: "$month",
        count: { $sum: 1 },
      },
    },
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
    { month: "December", count: 0 },
  ];

  users.forEach((user) => {
    const monthIndex = user._id - 1;
    data[monthIndex].count = user.count;
  });

  res.status(200).json({
    success: true,
    data,
  });
});

// contact form
exports.contactUs = catchAsyncError(async (req, res, next) => {
  const { name, email, message,subject } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  const html = `
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9;">
      <h1 style="color: #8429d6; text-align: center; margin-bottom: 20px; font-size: 36px;">Quickstart-AI</h1>
      <h2 style="color: #333; text-align: center; margin-bottom: 20px; font-size: 24px;">New Contact Us Message</h2>
      <div style="margin-bottom: 10px;">
          <p style="font-weight: bold;">Name:</p>
          <p style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #fff;">${name}</p>
      </div>
      <div style="margin-bottom: 10px;">
          <p style="font-weight: bold;">Email:</p>
          <p style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #fff;">${email}</p>
      </div>
      <div style="margin-bottom: 10px;">
          <p style="font-weight: bold;">Subject:</p>
          <p style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #fff;">${subject}</p>
      </div>
      <div style="margin-bottom: 10px;">
          <p style="font-weight: bold;">Message:</p>
          <p style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #fff;">${message}</p>
      </div>
  </div>
`;


  try {
    // The user's email is used as the 'from' address
    await sendEmail({
      from: email, // The user's email address
      subject: "Contact Us",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Email not sent",
    });
  }
});
