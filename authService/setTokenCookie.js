const { serialize } = require("cookie");
const setTokenCookie = (res, token, middlewareToken) => {
  res.setHeader("Set-Cookie", [
    // Secure, HttpOnly cookie
    serialize("token", token, {
      domain:".satishdev.me",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }),
    // Non-HttpOnly for middleware
    serialize("token_middleware", middlewareToken, {
       domain:".satishdev.me",
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }),
  ]);
};

module.exports = setTokenCookie;
