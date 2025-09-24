const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const RateLimit = sequelize.define(
  "RateLimit",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    expire: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "rate_limits",
    timestamps: false,
  }
);

module.exports = RateLimit;
