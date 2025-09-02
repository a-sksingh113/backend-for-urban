const {sequelize} = require("../../dbConnection/dbConfig");
const User = require("../userModel/userModel");
const Problem = require("../problemModel/problem");
const RequestHistory = require("../historyModel/requestHistory");
const PremiumPlan = require("../premiumPlan/plan");
const Payment = require("../paymentModel/payment");
const UserToken = require("../tokenModel/token");


// User <-> Problem
User.hasMany(Problem, { foreignKey: "userId", as: "problems" });
Problem.belongsTo(User, { foreignKey: "userId", as: "user" });

// User <-> RequestHistory
User.hasMany(RequestHistory, { foreignKey: "userId", as: "requests" });
RequestHistory.belongsTo(User, { foreignKey: "userId", as: "user" });

// Problem <-> RequestHistory
Problem.hasMany(RequestHistory, { foreignKey: "problemId", as: "histories" });
RequestHistory.belongsTo(Problem, { foreignKey: "problemId", as: "problem" });

// User <-> Payment
User.hasMany(Payment, { foreignKey: "userId", as: "payments" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

// PremiumPlan <-> Payment (which plan purchased)
PremiumPlan.hasMany(Payment, { foreignKey: "planId", as: "payments" });
Payment.belongsTo(PremiumPlan, { foreignKey: "planId", as: "plan" });

// User <-> UserToken (tokens purchased)
User.hasMany(UserToken, { foreignKey: "userId", as: "tokenBatches" });
UserToken.belongsTo(User, { foreignKey: "userId", as: "user" });


PremiumPlan.hasMany(UserToken, { foreignKey: "premiumPlanId", as: "purchases" });
UserToken.belongsTo(PremiumPlan, { foreignKey: "premiumPlanId", as: "plan" });
