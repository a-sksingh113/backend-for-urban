const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../model/userModel/userModel");
const {
  createToken,
  createMiddlewareToken,
} = require("../../authService/authService");
const setTokenCookie = require("../../authService/setTokenCookie");
const clearTokenCookie = require("../../authService/clearTokenCookie");
const { sendForgetPasswordEmail, sendVerificationEmail, sendPasswordResetSuccessEmail, sendCongratsEmail } = require("../../emailService/authEmail");

const handleSignup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });
    const verifyToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;

    await sendVerificationEmail(newUser.email, verifyUrl);

    res.status(201).json({
      success: true,
      verifyUrl,
      message:
        "User registered. Please check your email to verify your account.",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


const handleVerifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" });
    }

    user.isVerified = true;
    await user.save();

    await sendCongratsEmail(user.email);
    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};

const handleResendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" });
    }

    const verifyToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;

    await sendVerificationEmail(user.email, verifyUrl);

    return res.status(200).json({
      success: true,
      verifyUrl,
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "User registered with Google, use Google login or Reset password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid  password" });

    const token = createToken(user);
    const middlewareToken = createMiddlewareToken(user);

    setTokenCookie(res, token, middlewareToken);

    res
      .status(200)
      .json({ success: true, message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const handleLogout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendForgetPasswordEmail(user.email, resetUrl);

    res.json({ success: true, message: "Password reset email sent", resetUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const handleResetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken)
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await sendPasswordResetSuccessEmail(user.email);

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

module.exports = {
  handleSignup,
  handleLogin,
  handleLogout,
  handleForgotPassword,
  handleResetPassword,
  handleVerifyEmail,
  handleResendVerification
};
