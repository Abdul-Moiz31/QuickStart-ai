const express = require("express");
const router = express.Router();
const {
    createMessage,
    getAllMessages
} = require("../controllers/messageController");




// GET -> get All messages of a session
// URL -> /api/v1/message/session/:id
// Description -> Get all messages of a session by guest or chatbot owner from website or dashboard
router.route("/session/:id").get(getAllMessages);



// POST -> create a message
// URL -> /api/v1/message/create
// Description -> Create a message by guest 
// Request Body -> message, sessionId, role, chatbotId
router.route("/message/create").post(createMessage);



module.exports = router;