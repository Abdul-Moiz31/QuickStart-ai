const express = require("express");
const router = express.Router();
const isAuthenticatedUser = require("../middleware/Auth");


const { makePayment } = require("../controllers/paymentController");




// POST -> make a payment
// URL -> /api/v1/payment/create
// Description -> Make a payment by user


router.route("/create").post(isAuthenticatedUser,makePayment);