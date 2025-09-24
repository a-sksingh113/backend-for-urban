const {DataTypes} = require("sequelize");
const {sequelize} = require("../../dbConnection/dbConfig");
const User = require("../userModel/userModel");
const Problem = require("../problemModel/problem");

const RequestHistory = sequelize.define("RequestHistory", {
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
    onDelete: "CASCADE",
  },
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Problem,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "booked", "called","matched"),
    defaultValue: "pending",
    allowNull: false,
  },
  actionTaken: {
    type: DataTypes.ENUM("none", "booked", "called", "declined"),
    defaultValue: "none",
    allowNull: false,
  },
  topResults: {
    type: DataTypes.JSONB, 
    allowNull: true,
  },
  allResults: {
    type: DataTypes.JSONB, 
    allowNull: true,
  },
}, {
  tableName: "request_history",
  timestamps: true,
});

module.exports = RequestHistory;