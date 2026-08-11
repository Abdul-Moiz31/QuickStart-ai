const express = require("express");
const router = express.Router();
const {
    createSession,
    getAllSessions,
    getMonthlySessions,
    getAllSessionsMonthlyByAdmin,
    addMessageToSession
} = require("../controllers/sessionController");

const { isAuthenticatedUser } = require("../middleware/Auth");

// POST -> Add messages to a session
// URL -> /api/v1/session/addMessage
// Description -> Add messages to a session by guest

router.route("/addMessages").post(addMessageToSession);



// POST -> create a session
// URL -> /api/v1/session/create
// Description -> Create a session by guest
// Request Body -> username, email, chatbotId


router.route("/create").post(createSession);


// GET -> get All sessions
// URL -> /api/v1/session/owner
// Description -> Get all sessions of a chatbot by chatbot owner from dashboard




router.route("/owner").get(isAuthenticatedUser,getAllSessions);


// GET -> get All number of sessions of a chatbot in a month for  all  months
// URL -> /api/v1/session/monthly
// Description -> Get all sessions of a chatbot by chatbot owner from dashboard

router.route("/monthly").get(isAuthenticatedUser,getMonthlySessions);


// GET -> get All number of sessions of all chatbot in a month for  all  months by admin
// URL -> /api/v1/session/monthly/admin
// Description -> Get all sessions of all chatbot by admin from dashboard

router.route("/monthly/admin").get(isAuthenticatedUser,getAllSessionsMonthlyByAdmin);
 
module.exports = router;

