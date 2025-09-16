const Problem = require("../../model/problemModel/problem");
const User = require("../../model/userModel/userModel");
const sequelize = require("../../dbConnection/dbConfig").sequelize;
const RequestHistory = require("../../model/historyModel/requestHistory");
const { analyzeImageLabels } = require("../../googleServices/visionServices");
const {
  findNearbyPlaces,
  getPlaceDetails,
} = require("../../googleServices/placesServices");
const {
  scoreAndFilterPlaces,
} = require("../../googleServices/scoringServices");
const UserToken = require("../../model/tokenModel/token");
const { enhanceLabels } = require("../../utils/labelEnhancer");

const handleCreateProblem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { description, latitude, longitude, location } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude/longitude required",
      });
    }

    const user = await User.findByPk(userId, { transaction: t });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.tokensRemaining <= 0) {
      return res.status(403).json({
        success: false,
        message: "No tokens remaining. Please upgrade ",
      });
    }

    const problem = await Problem.create(
      {
        userId,
        imageUrl: req.fileUrl,
        description: description || null,
        location: location || null,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        status: "processing",
      },
      { transaction: t }
    );

    // 1) analyze image labels
    let labels = [];
    try {
      const labelObjs = await analyzeImageLabels(problem.imageUrl, 5);
      labels = labelObjs.map((l) => l.description);
      console.log("Detected labels:", labels);
    } catch (err) {
      console.warn("Vision analyze failed, falling back to description");
      labels = description ? [description] : ["repair"];
    }

       // 2) enhance labels dynamically
    const enhancedQueries = await enhanceLabels(labels);
   

    // 3) try searching with enhanced queries
    let places = [];
    for (const query of enhancedQueries.slice(0, 5)) { // limit to top 5 expanded queries
      const placesResp = await findNearbyPlaces(
        { lat: latitude, lng: longitude },
        query,
        parseInt(process.env.DEFAULT_PLACES_RADIUS || "5000")
      );
      if (placesResp.places?.length) {
        places = placesResp.places;
        
        break; // stop once we get results
      }
    }

    // 3) score & filter
    const scored = scoreAndFilterPlaces(
      places,
      parseFloat(latitude),
      parseFloat(longitude),
      labels, 
      {
        minRating: 3.0,
        maxPriceLevel: 3,
        preferOpenNow: true,
      }
    );

    // 4) enrich
    const topN = scored.slice(0, 10);
    const enrich = async (item) => {
      try {
        const details = await getPlaceDetails(item.place_id, [
          "id",
          "displayName",
          "formattedAddress",
          "internationalPhoneNumber",
          "websiteUri",
          "location",
          "rating",
          "userRatingCount",
          "currentOpeningHours",
          "photos"
        ]);
        return Object.assign({}, item, { details });
      } catch (e) {
        return item;
      }
    };

    const enrichDetails = true;
    const suggestions = enrichDetails
      ? await Promise.all(topN.map(enrich))
      : topN;

    // 5) save request history snapshot
    try {
      await RequestHistory.create(
        {
          userId,
          problemId: problem.id,
          status: "completed",
          actionTaken: "none",
          topResults: suggestions.slice(0, 3),
          allResults: suggestions,
        },
        { transaction: t }
      );
    } catch (err) {
      console.warn("Failed to save RequestHistory:", err.message || err);
    }

    // 6) update problem
    problem.detectedIssue = labels.join(", ");
    problem.status = "completed";
    await problem.save({ transaction: t });

    // 7) decrement tokens in User and UserToken
    user.tokensRemaining = Math.max(user.tokensRemaining - 1, 0);
    await user.save({ transaction: t });

    let userToken = await UserToken.findOne({
      where: { userId },
      transaction: t,
    });

    if (userToken) {
      userToken.tokensRemaining = Math.max(userToken.tokensRemaining - 1, 0);
      await userToken.save({ transaction: t });
    } else {
      await UserToken.create(
        { userId, tokensRemaining: user.tokensRemaining },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Processed",
      problem,
      detectedLabels: labels,
      suggestions,
      topSuggestions: suggestions.slice(0, 3),
      tokensRemaining: user.tokensRemaining,
    });
  } catch (err) {
    await t.rollback();
    console.error("handleCreateProblem error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


const handleGetProblems = async (req, res) => {
  try {
    const userId = req.user?.id;

    const problems = await Problem.findAll({
      where: { userId },
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
      ],
    });

    return res.status(200).json(problems);
  } catch (error) {
    console.error("Error fetching problems:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleGetProblemById = async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findByPk(problemId, {
      include: [{ model: User, attributes: ["id", "fullName", "email"] }],
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.status(200).json(problem);
  } catch (error) {
    console.error("Error fetching problem:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleDeleteProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const deleted = await Problem.destroy({ where: { id: problemId } });
    if (!deleted) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.status(200).json({ message: "Problem deleted successfully" });
  } catch (error) {
    console.error("Error deleting problem:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  handleCreateProblem,
  handleGetProblems,
  handleGetProblemById,
  handleDeleteProblem,
};
