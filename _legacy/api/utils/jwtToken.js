const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();

  // Options for cookie setting
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure:true,
    sameSite:"none"
  };
  

  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user,
      message
    });
};

module.exports = sendToken;
