const catchAsyncError = require("../middleware/catchAsyncError");
const Message = require("../models/messageModel");

exports.createMessage = catchAsyncError(async (req, res, next) => {
  const { message, sessionId, role, chatbotId } = req.body;

  if (!message || !sessionId || !role || !chatbotId) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  const newMessage = await Message.create({
    message,
    sessionId,
    role,
    chatbotId,
  });

  res.status(200).json({
    success: true,
    newMessage,
    message: "Message sent successfully",
  });
});

exports.getAllMessages = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Please provide a session id",
    });
  }

  // get all messages of a session by session id

  const messages = await Message.find({ sessionId: req.params.id });

  res.status(200).json({
    success: true,
    messages,
    message: "Messages fetched successfully",
  });
});
