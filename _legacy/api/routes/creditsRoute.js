const express = require("express");
const router = express.Router();
const {
    addUpCredits
} = require("../controllers/creditsController");


// POST -> add up credits
// URL -> /api/v1/credits/add
// Description -> Add up credits to user account after payment
// Request Body -> userId, credits , paymentId , paymentStatus 




router.route("/add").post(addUpCredits);




module.exports = router;

