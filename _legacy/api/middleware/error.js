const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //Wrong mongodb id error
  if (err.name == "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  //Wrong JWT error
  if (err.name == "JsonWebTokenError") {
    const message = `Json Web Token is invalid , try again`;
    err = new ErrorHandler(message, 404);
  }

  //JWT expire error
  if (err.name == "TokenExpireError") {
    const message = `Json Web Token is Expired , try again`;
    err = new ErrorHandler(message, 404);
  }

  res.status(err.statusCode).json({
    succes: false,
    message: err.message,
    // error:err.stack,
  });
};
