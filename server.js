require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const initDB = require("./dbConnection/dbSync");

const PORT = process.env.PORT || 7568;
const app = express();

const allowedOrigins = [process.env.FRONTEND_URL];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

const checkForAuthenticationCookie = require("./middleware/authMiddleware");
const { authorizeRoles } = require("./middleware/roleMiddleware");
const authRoutes = require("./routes/authRoute/userAuthRoute");
const googleAuthRoute = require("./routes/authRoute/loginWithGoogle");
const userProfileRoute = require("./routes/profileRoute/userProfileRoute");
const problemRoute = require("./routes/problemFindRoute/problemRoute");
const requestHistoryRoute = require("./routes/requestHistory/requestRoute");
const { apiLimiter, authLimiter } = require("./middleware/limitConfig");

app.use("/api", apiLimiter);
app.use("/api/auth",authLimiter, authRoutes, googleAuthRoute);
app.use(
  "/api/user",
  checkForAuthenticationCookie("token"),
  authorizeRoles(["user", "admin"]),
  userProfileRoute,
  problemRoute,
  requestHistoryRoute
);

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
