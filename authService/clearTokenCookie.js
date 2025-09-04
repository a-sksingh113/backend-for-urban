const { serialize } = require("cookie");

const clearTokenCookie = (res) => {
  res.setHeader("Set-Cookie", [
    serialize("token", "", {
       domain:".satishdev.me",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    }),
    serialize("token_middleware", "", {
       domain:".satishdev.me",
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    }),
  ]);
};

module.exports = clearTokenCookie;
