const express = require("express");
const { handleSignup, handleLogin, handleLogout, handleForgotPassword, handleResetPassword, handleVerifyEmail, handleResendVerification } = require("../../controller/userController/userAuthController");
const router = express.Router();


router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password/:resetToken", handleResetPassword);
router.get("/verify-email/:token", handleVerifyEmail);
router.post("/resend-verification", handleResendVerification);


module.exports = router;
