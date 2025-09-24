const Problem = require("../../model/problemModel/problem");
const User = require("../../model/userModel/userModel");
const sequelize = require("../../dbConnection/dbConfig").sequelize;
const RequestHistory = require("../../model/historyModel/requestHistory");
const { analyzeImageLabels } = require("../../googleServices/visionServices");
const { findNearbyPlaces, getPlaceDetails } = require("../../googleServices/placesServices");
const UserToken = require("../../model/tokenModel/token");
const { classifyServiceWithScore } = require("../../utils/classifyService");

const handleCreateProblem = async (req, res) => {
  console.log("----- [handleCreateProblem] START -----");
  const t = await sequelize.transaction();

  try {
    const userId = req.user?.id;
    console.log("User ID from token:", userId);

    if (!userId) {
      await t.rollback();
      console.warn("Unauthorized: No userId in request");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { description, latitude, longitude, location } = req.body;
    console.log("Request body:", { description, latitude, longitude, location });

    if (!latitude || !longitude) {
      await t.rollback();
      console.warn("Missing latitude/longitude");
      return res.status(400).json({ success: false, message: "latitude/longitude required" });
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    console.log(`Parsed coordinates: lat=${latNum}, lng=${lngNum}`);

    const user = await User.findByPk(userId, { transaction: t });
    console.log("User fetched:", user ? user.id : "NOT FOUND");

    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.tokensRemaining <= 0) {
      await t.rollback();
      console.warn("User has no tokens remaining");
      return res.status(403).json({ success: false, message: "No tokens remaining. Please upgrade" });
    }
    console.log("Tokens remaining:", user.tokensRemaining);


    console.log("Creating problem record...");
    const problem = await Problem.create(
      {
        userId,
        imageUrl: req.fileUrl,
        description: description || null,
        location: location || null,
        latitude: latNum,
        longitude: lngNum,
        status: "processing",
      },
      { transaction: t }
    );
    console.log("Problem created with ID:", problem.id);

    // Commit early so transaction is not held during API calls
    await t.commit();


    console.log("Starting Vision API label detection...");
   
    const vision = await analyzeImageLabels(problem.imageUrl);
    console.log("Final detected labels:", vision);

    const serviceType = classifyServiceWithScore(vision.candidates);
    console.log("Classified service type:", serviceType);

    const radius = parseInt(process.env.DEFAULT_PLACES_RADIUS, 10);
    console.log(`Searching Google Places for "${serviceType.category}" within ${radius}m`);

    let places = await findNearbyPlaces(serviceType.category, latNum, lngNum, radius);
    console.log(`Found ${places.length} nearby places`);

    // Deduplicate places by ID
    const uniqById = new Map();
    places.forEach((p) => {
      const id = p?.id || p?.place_id || p?.placeId || (p.displayName?.name || p.displayName?.text);
      if (id && !uniqById.has(id)) uniqById.set(id, p);
    });
    places = Array.from(uniqById.values());
    console.log(`Total unique places: ${places.length}`);

    // Get detailed info for each place
    const placesDetails = await Promise.all(
      places.map(async (p) => {
        if (!p.place_id) return p;
        try {
          const details = await getPlaceDetails(p.place_id, [
            "id",
            "displayName",
            "formattedAddress",
            "internationalPhoneNumber",
            "websiteUri",
            "location",
            "rating",
            "userRatingCount",
            "currentOpeningHours",
            "photos",
          ]);
          return { ...p, details };
        } catch (err) {
          console.warn("getPlaceDetails failed for", p.place_id, err.message);
          return p;
        }
      })
    );

  
    const t2 = await sequelize.transaction();
    try {
      console.log("Saving request history...");
      await RequestHistory.create(
        {
          userId,
          problemId: problem.id,
          status: "completed",
          actionTaken: "none",
          topResults: placesDetails,
          allResults: places,
        },
        { transaction: t2 }
      );

      problem.detectedIssue = vision.candidates.join(", ") || "unknown";
      problem.status = "completed";
      await problem.save({ transaction: t2 });
      console.log("Problem updated to completed");

      user.tokensRemaining = Math.max(user.tokensRemaining - 1, 0);
      await user.save({ transaction: t2 });
      console.log("User tokens decremented to:", user.tokensRemaining);

      let userToken = await UserToken.findOne({ where: { userId }, transaction: t2 });
      if (userToken) {
        userToken.tokensRemaining = Math.max(userToken.tokensRemaining - 1, 0);
        await userToken.save({ transaction: t2 });
        console.log("UserToken updated");
      } else {
        await UserToken.create({ userId, tokensRemaining: user.tokensRemaining }, { transaction: t2 });
        console.log("UserToken created");
      }

      await t2.commit();
      console.log("Transaction 2 committed successfully");
    } catch (err) {
      if (!t2.finished) await t2.rollback();
      console.warn("Failed to save request history or update DB:", err.message || err);
    }

    console.log("----- [handleCreateProblem] END -----");
    return res.status(200).json({
      success: true,
      message: "Processed",
      problem,
      serviceType,
      length:places.length,
      places,
      placesDetails,
      tokensRemaining: user.tokensRemaining,
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error("handleCreateProblem error:", err);
    console.log("----- [handleCreateProblem] FAILED -----");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};




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
//         imageUrl: req.fileUrl,
//         description: description || null,
//         location: location || null,
//         latitude: parseFloat(req.body.latitude),
//         longitude: parseFloat(req.body.longitude),
//         status: "processing",
//       },
//       { transaction: t }
//     );

//  let labels = [];
//     try {
//       const labelObjs = await analyzeImageLabels(problem.imageUrl, 10);
//       labels = (labelObjs || []).map((l) =>
//         typeof l === "string" ? l : (l?.description || "")
//       ).filter(Boolean);
//       console.log("Detected labels:", labels);
//       if (!labels.length) {
//         // fallback to description if vision returned nothing useful
//         labels = description ? [description] : ["repair"];
//       }
//     } catch (err) {
//       console.warn("Vision analyze failed, falling back to description:", err?.message || err);
//       labels = description ? [description] : ["repair"];
//     }

//     // 2) enhance labels -> create text queries
//     const enhancedQueries = await enhanceLabels(labels);
//     console.log("Enhanced Queries:", enhancedQueries);


//     // 3) try searching with enhanced queries
//     let places = [];
//     const radius = parseInt(process.env.DEFAULT_PLACES_RADIUS || "10000", 10);

//     for (const query of (enhancedQueries || []).slice(0, 6)) {
//       try {
//         const resp = await findNearbyPlaces({ lat: latNum, lng: lngNum }, query, radius);

//         // Normalize response shapes into an array of place objects
//         let respPlaces = [];
//         if (!resp) {
//           respPlaces = [];
//         } else if (Array.isArray(resp)) {
//           respPlaces = resp;
//         } else if (resp.places && Array.isArray(resp.places)) {
//           respPlaces = resp.places;
//         } else if (resp.data && resp.data.places && Array.isArray(resp.data.places)) {
//           respPlaces = resp.data.places;
//         } else if (resp.data && Array.isArray(resp.data)) {
//           respPlaces = resp.data;
//         } else if (resp.results && Array.isArray(resp.results)) {
//           respPlaces = resp.results;
//         } else if (resp.candidates && Array.isArray(resp.candidates)) {
//           respPlaces = resp.candidates;
//         } else {
//           // as last resort, try to extract any array-like properties
//           const possibleArrays = Object.values(resp).filter(v => Array.isArray(v));
//           respPlaces = possibleArrays.length ? possibleArrays[0] : [];
//         }

//         if (respPlaces.length) {
//           places = places.concat(respPlaces);
//           console.log(`Found ${respPlaces.length} places for query "${query}"`);
//         } else {
//           console.log(`No places for query "${query}"`);
//         }
//       } catch (err) {
//         console.warn("Places search failed for query", query, err?.response?.data || err?.message || err);
//       }
//     }

//     console.log(`Total collected places (pre-dedupe): ${places.length}`);

//     // dedupe by id (handle multiple id field names)
//     const uniqById = new Map();
//     places.forEach((p) => {
//       const id =
//         p?.id ||
//         p?.place_id ||
//         p?.placeId ||
//         (p.displayName && (p.displayName.name || p.displayName.text)) ||
//         null;
//       if (!id) return;
//       if (!uniqById.has(id)) uniqById.set(id, p);
//     });
//     places = Array.from(uniqById.values());
//     console.log(`Total unique places: ${places.length}`);
//     // 3) score & filter
//     const scored = scoreAndFilterPlaces(
//       places,
//       parseFloat(latitude),
//       parseFloat(longitude),
//       labels, 
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
//           "id",
//           "displayName",
//           "formattedAddress",
//           "internationalPhoneNumber",
//           "websiteUri",
//           "location",
//           "rating",
//           "userRatingCount",
//           "currentOpeningHours",
//           "photos"
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
