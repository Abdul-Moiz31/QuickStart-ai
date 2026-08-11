const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

exports.makePayment = catchAsyncError(async (req, res, next) => {
  const { price } = req.body;
  const amount = parseInt(price * 100); //stripe only recognizes price in cents;
  if (!price || amount < 1) return;
  const { client_secret } = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });
  res.send({ clientSecret: client_secret }); //send the paymentIntent object's client_secret to the client side
});
