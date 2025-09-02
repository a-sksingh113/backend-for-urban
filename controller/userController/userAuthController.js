const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../model/userModel/userModel");
const {
  createToken,
  createMiddlewareToken,
} = require("../../authService/authService");
const setTokenCookie = require("../../authService/setTokenCookie");
const clearTokenCookie = require("../../authService/clearTokenCookie");
const { sendForgetPasswordEmail } = require("../../emailService/authEmail");

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
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
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
};
