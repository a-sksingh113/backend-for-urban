const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");
const User = require("../userModel/userModel");

const UserToken = sequelize.define(
  "UserToken",
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
    tokensRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tokenUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "user_tokens",
    timestamps: true,
  }
);

module.exports = UserToken;
