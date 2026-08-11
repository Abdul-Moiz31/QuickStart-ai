const express = require("express");
const router = express.Router();
const {
    getResponse,
    testByOwner
} = require("../controllers/chatbotController");
const { isAuthenticatedUser } = require("../middleware/Auth");



// This route will get the past messages from the user , session_id, chatbot_id 

// POST -> request to get response from the chatbot
// URL -> /api/v1/chatbot/getResponse
// Description -> Get response from the chatbot
// Request Body -> messages, newmessage , session_id, chatbot_id



router.route("/getResponse").post(getResponse);

router.route("/test/owner").post(isAuthenticatedUser,testByOwner)



module.exports = router;





