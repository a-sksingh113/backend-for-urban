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

// const handleCreateProblem = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ success: false, message: "Unauthorized" });

//     const { description, latitude, longitude, location } = req.body;
//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: "latitude/longitude required",
//       });
//     }

//     const user = await User.findByPk(userId, { transaction: t });
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });

//     if (user.tokensRemaining <= 0) {
//       return res.status(403).json({
//         success: false,
//         message: "No tokens remaining. Please upgrade ",
//       });
//     }

//     const problem = await Problem.create(
//       {
//         userId,
//         imageUrl: req.fileUrl || null,
//         description: description || null,
//         location: location || null,
//         latitude: parseFloat(req.body.latitude),
//         longitude: parseFloat(req.body.longitude),
//         status: "processing",
//       },
//       { transaction: t }
//     );

//     // 1) analyze image labels
//     let labels = [];
//     try {
//       const labelObjs = await analyzeImageLabels(imageUrl, 5);
//       labels = labelObjs.map((l) => l.description);
//     } catch (err) {
//       console.warn("Vision analyze failed, falling back to description");
//       labels = description ? [description] : ["repair"];
//     }

//     const searchKeywords = labels.slice(0, 3).join(" ");

//     // 2) search places
//     const placesResp = await findNearbyPlaces(
//       { lat: latitude, lng: longitude },
//       searchKeywords,
//       parseInt(process.env.DEFAULT_PLACES_RADIUS || "5000")
//     );
//     const places = placesResp.results || [];

//     // 3) score & filter
//     const scored = scoreAndFilterPlaces(
//       places,
//       parseFloat(latitude),
//       parseFloat(longitude),
//       {
//         minRating: 3.0,
//         maxPriceLevel: 3,
//         preferOpenNow: true,
//       }
//     );

//     // 4) enrich
//     const topN = scored.slice(0, 10);
//     const enrich = async (item) => {
//       try {
//         const details = await getPlaceDetails(item.place_id, [
//           "name",
//           "formatted_phone_number",
//           "website",
//           "formatted_address",
//           "opening_hours",
//           "rating",
//           "user_ratings_total",
//         ]);
//         return Object.assign({}, item, { details });
//       } catch (e) {
//         return item;
//       }
//     };

//     const enrichDetails = true;
//     const suggestions = enrichDetails
//       ? await Promise.all(topN.map(enrich))
//       : topN;

//     // 5) save request history snapshot
//     try {
//       await RequestHistory.create(
//         {
//           userId,
//           problemId: problem.id,
//           status: "completed",
//           actionTaken: "none",
//           topResults: suggestions.slice(0, 3),
//           allResults: suggestions,
//         },
//         { transaction: t }
//       );
//     } catch (err) {
//       console.warn("Failed to save RequestHistory:", err.message || err);
//     }

//     // 6) update problem
//     problem.detectedIssue = labels.join(", ");
//     problem.status = "completed";
//     await problem.save({ transaction: t });

//     // 7) decrement tokens in User and UserToken
//     user.tokensRemaining = Math.max(user.tokensRemaining - 1, 0);
//     await user.save({ transaction: t });

//     let userToken = await UserToken.findOne({
//       where: { userId },
//       transaction: t,
//     });

//     if (userToken) {
//       userToken.tokensRemaining = Math.max(userToken.tokensRemaining - 1, 0);
//       await userToken.save({ transaction: t });
//     } else {
//       await UserToken.create(
//         { userId, tokensRemaining: user.tokensRemaining },
//         { transaction: t }
//       );
//     }

//     await t.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Processed",
//       problem,
//       detectedLabels: labels,
//       suggestions,
//       topSuggestions: suggestions.slice(0, 3),
//       tokensRemaining: user.tokensRemaining,
//     });
//   } catch (err) {
//     await t.rollback();
//     console.error("handleCreateProblem error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

// const handleCreateProblem = async (req, res) => {
//   try {
//     const userId = req?.user?.id;
//     if (!userId) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Unauthorized: user ID missing" });
//     }
//     const { description, location, latitude, longitude } = req.body;

//     const user = await User.findByPk(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     if (user.tokensRemaining <= 0) {
//       return res.status(403).json({
//         success: false,
//         message: "No tokens remaining. Please upgrade",
//       });
//     }

//     const problem = await Problem.create({
//       userId,
//       imageUrl: req.fileUrl,
//       description: description || null,
//       location: location || null,
//       latitude: parseFloat(req.body.latitude),
//       longitude: parseFloat(req.body.longitude),
//     });

//     user.tokensRemaining = Math.max(user.tokensRemaining - 1, 0);
//     await user.save();

//     let userToken = await UserToken.findOne({ where: { userId } });
//     if (userToken) {
//       userToken.tokensRemaining = Math.max(userToken.tokensRemaining - 1, 0);
//       await userToken.save();
//     } else {
//       await UserToken.create({ userId, tokensRemaining: user.tokensRemaining });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Problem Image Submitted successfully",
//       problem,
//     });
//   } catch (error) {
//     console.error("Error creating problem:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

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
        message: "No tokens remaining. Please upgrade",
      });
    }
    user.requestCount = (user.requestCount || 0) + 1;

    const problem = await Problem.create(
      {
        userId,
        imageUrl: req.fileUrl,
        description: description || null,
        location: location || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      { transaction: t }
    );

    /** ---------- DUMMY DATA BLOCK ---------- */
    const labels = description ? [description] : ["repair", "maintenance"];
    const suggestions = [
      {
        place_id: "dummy_1",
        name: "ABC Repair Shop",
        formatted_address: "123 Main Street",
        rating: 4.5,
        distance: 1.5,
        availability: "yes",
        user_ratings_total: 20,
        formatted_phone_number: "+91 9876543210",
        website: "https://dummyshop1.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/2843b2d2-c3d0-4ceb-9ebc-0430cfe3c895.png",
      },
      {
        place_id: "dummy_2",
        name: "XYZ Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 4.2,
        distance: 2.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456780",
        website: "https://dummyshop2.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/ce9ce6a7-2f37-491a-b344-f35a3e1aed9a.png",
      },
      {
        place_id: "dummy_3",
        name: "MNC Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 4.0,
        distance: 3.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123566780",
        website: "https://dummyshop3.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/e55eb955-55e2-4b40-8d91-fbd6f2826dab.png",
      },
      {
        place_id: "dummy_4",
        name: "YSC Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 3.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123454660",
        website: "https://dummyshop4.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/14fc2c18-3371-4aa8-9684-ce0b83b61494.png://dummyshop4.example.com/image.jpg",
      },
      {
        place_id: "dummy_5",
        name: "ORT Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 2.2,
        distance: 5.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/a02cd627-1123-4e6f-9e38-c642e1b3a7b4.png",
      },

      {
        place_id: "dummy_6",
        name: "ORW Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 0.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/8801179b-f69e-4b13-94e0-0a593acb1328.png",
      },
      {
        place_id: "dummy_6",
        name: "ORW Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 0.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/5bda69cb-f054-4abf-baa8-0c6d69e7e496.png",
      },
      {
        place_id: "dummy_7",
        name: "GRT Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 1.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/a02cd627-1123-4e6f-9e38-c642e1b3a7b4.png",
      },

      {
        place_id: "dummy_8",
        name: "SFT Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 4.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/5bda69cb-f054-4abf-baa8-0c6d69e7e496.png",
      },

      {
        place_id: "dummy_9",
        name: "NJT Maintenance Services",
        formatted_address: "456 Market Road",
        rating: 3.2,
        distance: 4.0,
        availability: "yes",
        user_ratings_total: 15,
        formatted_phone_number: "+91 9123456745",
        website: "https://dummyshop5.example.com",
        bussiness_shop_image:
          "https://hzjqbvjwneamcdxyftep.supabase.co/storage/v1/object/public/user-uploads/a02cd627-1123-4e6f-9e38-c642e1b3a7b4.png",
      },
    ];
    /** ---------- END DUMMY DATA BLOCK ---------- */

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

    problem.detectedIssue = labels.join(", ");
    problem.status = "completed";
    await problem.save({ transaction: t });

    user.tokensRemaining = Math.max(user.tokensRemaining - 1, 0);
    user.tokenUsed = (user.tokenUsed || 0) + 1;
    await user.save({ transaction: t });

    let userToken = await UserToken.findOne({
      where: { userId },
      transaction: t,
    });
    if (userToken) {
      userToken.tokensRemaining = Math.max(userToken.tokensRemaining - 1, 0);
      userToken.tokenUsed = (userToken.tokenUsed || 0) + 1;
      await userToken.save({ transaction: t });
    } else {
      await UserToken.create(
        { userId, tokensRemaining: user.tokensRemaining, tokenUsed: 1 },
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
      tokenUsed: user.tokenUsed,
      requestCount: user.requestCount,
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
