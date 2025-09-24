const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    googleId: {
      type: DataTypes.STRING,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePhoto: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    tokensRemaining: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    requestCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tokenUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    hasPremiumAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isTwoFactorAuthEnable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    role: {
      type: DataTypes.ENUM("user", "admin", "admin+", "superadmin"),
      defaultValue: "user",
    },
    verificationCode: {
      type: DataTypes.STRING,
    },
    verificationCodeExpiresAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
