const { DataTypes } = require("sequelize");
const {sequelize} = require("../../dbConnection/dbConfig");
const User = require("../userModel/userModel");
const Payment = require("../paymentModel/payment");
const PremiumPlan = require("../premiumPlan/plan");

const Subscription = sequelize.define(
  "Subscription",
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
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Payment,
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
    status: {
      type: DataTypes.ENUM(
        "active",
        "expired",
        "canceled",
        "incomplete"
      ),
      defaultValue: "active",
    },
  },
  {
    tableName: "subscriptions",
    timestamps: true,
  }
);

module.exports = Subscription;
