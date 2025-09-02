const express = require("express");
const { handleSignup, handleLogin, handleLogout, handleForgotPassword, handleResetPassword } = require("../../controller/userController/userAuthController");
const router = express.Router();


router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password/:resetToken", handleResetPassword);

module.exports = router;
