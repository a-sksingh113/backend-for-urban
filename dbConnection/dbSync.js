const {sequelize} = require("../dbConnection/dbConfig");
const User = require("../model/userModel/userModel");
const Problem = require("../model/problemModel/problem");
const Payment = require("../model/paymentModel/payment");
const UserToken  = require("../model/tokenModel/token");
const Subscription = require('../model/subscriptionModel/subscription');
const PremiumPlan = require("../model/premiumPlan/plan");
const RequestHistory = require("../model/historyModel/requestHistory");



const initDB = (callback) => {
  sequelize.authenticate()
    .then(() => {
      console.log(' Database connected');
      require('../model/associationModel/association');
      return sequelize.sync(); // Creates tables if not exist {alter:true}
    })
    .then(() => {
      console.log(' All models synced');
      callback(); 
    })
    .catch((error) => {
      console.error(' Error connecting to the database:', error);
      process.exit(1); 
    });
};
module.exports = initDB;