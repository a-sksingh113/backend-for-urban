const { DataTypes } = require("sequelize");
const {sequelize} = require("../../dbConnection/dbConfig");
const PremiumPlan = require("../premiumPlan/plan");
const User = require("../userModel/userModel");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    premiumPlanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: PremiumPlan,
        key: "id",
      },
    },
    paymentSessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentSessionProvider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM("USD", "EUR", "INR"),
      allowNull: false,
      defaultValue: "USD",
    },
    status: {
      type: DataTypes.ENUM("succeeded", "pending", "failed"),
      defaultValue: "succeeded",
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

module.exports = Payment;
