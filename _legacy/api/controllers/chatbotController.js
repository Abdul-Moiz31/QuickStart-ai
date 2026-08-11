const catchAsyncError = require("../middleware/catchAsyncError");
const PollinationsAI = require("../utils/pollinationsAI");
const User = require("../models/userModel");
const Session = require("../models/sessionModel");
const Message = require("../models/messageModel");

const systemPrompt = `You are a friendly and professional customer service chatbot for a business.

IMPORTANT RULES:
- Respond naturally and conversationally like a human customer service agent
- Never show template labels like "*Business Details*", "*Response*", "*User's Message*" in your replies
- Never repeat the question back to the user
- Keep responses concise and helpful
- If you don't know something, politely say so and suggest contacting the business directly
- Use the business details provided to answer questions accurately
- Remember the conversation history and refer to it when relevant
- Always respond directly to what the user just said`;

exports.getResponse = catchAsyncError(async (req, res, next) => {
  const { messages, message, session_id, chatbot_id } = req.body;

  if (!messages || !message || !session_id || !chatbot_id) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  const owner = await User.findById(chatbot_id);

  const bussinessDetails = owner.bussinessDetails;

  if (!bussinessDetails || bussinessDetails.length < 10) {
    return res.status(400).json({
      success: false,
      message: "Not enough business details",
    });
  }

  const businessDetailsText = bussinessDetails
    .map(detail => `Q: ${detail.question}\nA: ${detail.answer}`)
    .join("\n");

  const messagesText = messages.length > 0
    ? messages.map(detail => `Customer: ${detail.question}\nBot: ${detail.answer}`).join("\n")
    : "No previous messages";

  const pollinationsAI = new PollinationsAI();

  const completion = await pollinationsAI.generateContent({
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `\n\n--- BUSINESS INFO ---\nBusiness Name: ${owner.bussinessName}\nBusiness Description: ${owner.bussinessDescription}\n\nBusiness Details:\n${businessDetailsText}` },
          { text: `\n\n--- CONVERSATION HISTORY ---\n${messagesText}` },
          { text: `\n\n--- CUSTOMER'S CURRENT MESSAGE ---\n${message}\n\nYour response:` },
        ],
      },
    ],
  });

  const session = await Session.findById(session_id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
    });
  }

  const userMessage = await Message.create({
    sessionId: session_id,
    message,
    role: "user",
    chatbotId: chatbot_id,
  });

  session.messages.push(userMessage._id);

  const chatbotMessage = await Message.create({
    sessionId: session_id,
    message: completion.response.candidates[0].content.parts[0].text,
    role: "chatbot",
    chatbotId: chatbot_id,
  });

  session.messages.push(chatbotMessage._id);

  await session.save();

  res.status(200).json({
    success: true,
    data: completion.response.candidates[0].content.parts[0].text,
  });
});


exports.testByOwner = catchAsyncError(async (req, res, next) => {
  const owner = req.user;
  const { messages, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Please enter a message",
    });
  }

  const { bussinessDetails } = owner;

  const businessDetailsText = bussinessDetails && bussinessDetails.length > 0
    ? bussinessDetails.map(detail => `Q: ${detail.question}\nA: ${detail.answer}`).join("\n")
    : "No business details available";

  const messagesText = messages && messages.length > 0
    ? messages.map(detail => `Customer: ${detail.question}\nBot: ${detail.answer}`).join("\n")
    : "No previous messages";

  const pollinationsAI = new PollinationsAI();

  const completion = await pollinationsAI.generateContent({
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `\n\n--- BUSINESS INFO ---\nBusiness Name: ${owner.bussinessName}\nBusiness Description: ${owner.bussinessDescription}\n\nBusiness Details:\n${businessDetailsText}` },
          { text: `\n\n--- CONVERSATION HISTORY ---\n${messagesText}` },
          { text: `\n\n--- CUSTOMER'S CURRENT MESSAGE ---\n${message}\n\nYour response:` },
        ],
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: completion.response.candidates[0].content.parts[0].text,
  });
});