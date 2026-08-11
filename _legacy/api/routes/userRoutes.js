const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  loadUserProfile,
  addBussinessDetails,
  deleteBussinessDetails,
  generateNewToken,
  getAllUsers,
  getUsersMonthly,
  findChatbotUsingToken,
  contactUs
} = require("../controllers/userController");

const { isAuthenticatedUser } = require("../middleware/Auth");



router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/bussinessDetails").post(isAuthenticatedUser, addBussinessDetails);
router.route("/businessDetails/:id").delete(isAuthenticatedUser, deleteBussinessDetails);
router.route("/token").post(isAuthenticatedUser, generateNewToken);
router.route("/token/verify").get(findChatbotUsingToken)

// user profile route
router
  .route("/me")
  .get(isAuthenticatedUser, loadUserProfile);

  // contact us route
  router.route("/contact").post(contactUs);

  // [ADMIN]

  // GET -> get All users
  // URL -> /api/v1/users
  // Description -> Get all users by admin
  // Request Body -> None

  router.route("/all").get(isAuthenticatedUser, getAllUsers);


  // GET -> get users stats according to monthly 
  // URL -> /api/v1/users/monthly
  // Description -> Get all users stats according to monthly by admin
  // Request Body -> None

  router.route("/monthly").get(isAuthenticatedUser, getUsersMonthly);


  



module.exports = router;
