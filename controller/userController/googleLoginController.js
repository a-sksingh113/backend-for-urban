require("dotenv").config();
const axios = require("axios");
const setTokenCookie = require("../../authService/setTokenCookie");
const jwt = require("jsonwebtoken");
const User = require("../../model/userModel/userModel");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const qs = require("querystring");
const encrypt = require("../../authService/encrption");

const redirectToGoogle = (req, res) => {
  const googleAuthURL =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid profile email`;
  res.redirect(googleAuthURL);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Authorization code missing" });
  }

  try {
    //Get the access token from Google
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = response.data;

    // Get user info from Google
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { sub: googleId, name, email, picture } = userResponse.data;

    if (!googleId) {
      return res
        .status(400)
        .json({ message: "Google ID missing from response" });
    }

 
    let user = await User.findOne({ where: { googleId } });

    if (user) {
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }
    } else {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({
          googleId,
          fullName: name,
          email,
          profilePhoto: picture,
          password: null,
          isVerified: true,
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

     const middlewareToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    setTokenCookie(res, token, middlewareToken);

    const userData = JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      tokensRemaining: user.tokensRemaining,
      tokenUsed: user.tokenUsed,
      requestCount: user.requestCount,
      hasPremiumAccess: user.hasPremiumAccess
    });
    const encrypted = encrypt(userData);

    res.redirect(
      `${FRONTEND_URL}/?data=${encodeURIComponent(encrypted)}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  googleCallback,
  redirectToGoogle,
};
