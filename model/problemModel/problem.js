const { DataTypes } = require("sequelize");
const {sequelize} = require("../../dbConnection/dbConfig");
const User = require("../userModel/userModel");

const Problem = sequelize.define(
  "Problem",
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
      onDelete: "CASCADE",
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING, 
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false, 
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
       detectedIssue: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
  },
  {
    tableName: "problems",
    timestamps: true,
  }
);

module.exports = Problem;
