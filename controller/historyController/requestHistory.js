const RequestHistory = require("../../model/historyModel/requestHistory");
const User = require("../../model/userModel/userModel");
const Problem = require("../../model/problemModel/problem");

const handleGetUserHistory = async (req, res) => {
  try {
    const  userId  = req?.user.id;

    if (!userId) {
      return res.status(400).json({success: false, message: "User ID is required" });
    }
    const history = await RequestHistory.findAll({
      where: { userId },
      attributes: ["id","status"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "tokensRemaining", "requestCount", "tokenUsed"],
        },
        {
          model: Problem,
          as: "problem",
          attributes: ["id", "detectedIssue", "imageUrl", "location"],
        },
      ],
      order: [["createdAt", "DESC"]], 
    });

    if (!history || history.length === 0) {
      return res.status(404).json({ success: false, message: "No history found for this user" });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  handleGetUserHistory,
};
