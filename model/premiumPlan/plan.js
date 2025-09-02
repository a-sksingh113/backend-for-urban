const { DataTypes } = require("sequelize");
const {sequelize} = require("../../dbConnection/dbConfig");

const PremiumPlan = sequelize.define(
  "PremiumPlan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    tokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM("USD", "EUR", "INR"),
      allowNull: false,
      defaultValue: "USD",
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "premium_plans",
    timestamps: true,
  }
);

module.exports = PremiumPlan;
