const { serialize } = require("cookie");
const clearTokenCookie = (res) => {
  res.setHeader("Set-Cookie", [
    serialize("token", "", {
       domain:".pixbit.me",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    }),
    serialize("token_middleware", "", {
       domain:".pixbit.me",
      httpOnly: false,
      secure: true,
      sameSite: "none",
       path: "/",
      expires: new Date(0),
    }),
  ]);
};

module.exports = clearTokenCookie;
