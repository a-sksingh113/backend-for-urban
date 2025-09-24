// utils/improvedFilter.js
const TRADE_MAPPING = require(".././utils/tradeMapping"); // adjust path if needed

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function tokens(str = "") {
  return Array.from(
    new Set(
      (str || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
    )
  );
}

function tokenOverlapScore(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  let inter = 0;
  tokensA.forEach((t) => setB.has(t) && inter++);
  const avgLen = (tokensA.length + tokensB.length) / 2;
  return inter / Math.max(1, avgLen);
}

const TRADE_KEYWORDS = Object.values(TRADE_MAPPING)
  .flat()
  .map((s) => s.toLowerCase());

function hasTradeKeyword(textTokens) {
  for (const kw of TRADE_KEYWORDS) {
    if (textTokens.includes(kw)) return true;
  }
  return false;
}

function computeMatchScore(visionLabels = [], placeText = "", placeTypes = []) {
  const placeTokens = tokens(placeText);
  const typeTokens = (placeTypes || []).map((t) => (t || "").toLowerCase());
  const allPlaceTokens = Array.from(new Set([...placeTokens, ...typeTokens]));

  const labelTokens = tokens(visionLabels.join(" "));
  const overlap = tokenOverlapScore(labelTokens, allPlaceTokens);

  const tradeHit = hasTradeKeyword(allPlaceTokens) ? 1.0 : 0;

  const nameTokenScore = tokenOverlapScore(labelTokens, tokens(placeText));

  const matchScore = Math.min(1, tradeHit * 0.6 + overlap * 0.5 + nameTokenScore * 0.4);

  const matched = [];
  for (const t of allPlaceTokens) {
    for (const label of visionLabels) {
      if (t && label.toLowerCase().includes(t)) matched.push(t);
    }
  }

  return { matchScore, matchedKeywords: Array.from(new Set(matched)) };
}

function safeGetPlaceName(p) {
  return (
    (p.displayName && (p.displayName.text || p.displayName)) ||
    p.name ||
    p.formattedAddress ||
    p.formatted_address ||
    (p.address && (p.address.text || p.address)) ||
    ""
  );
}
function safeGetLatitude(p) {
  return p.location?.latitude ?? p.geometry?.location?.lat ?? p.geometry?.location?.latitude ?? null;
}
function safeGetLongitude(p) {
  return p.location?.longitude ?? p.geometry?.location?.lng ?? p.geometry?.location?.longitude ?? null;
}

function scoreAndFilterPlaces(
  places = [],
  userLat,
  userLng,
  visionLabels = [],
  options = {}
) {
  const {
    minRating = 2.0,
    preferOpenNow = true,
    minMatchScore = 0.12,
    maxDistanceMeters = 50000,
  } = options;

  const mapped = (places || [])
    .map((p) => {
      try {
        const name = safeGetPlaceName(p) || "";
        const vicinity = p.formattedAddress || p.formatted_address || (p.address && p.address.text) || "";
        const lat = safeGetLatitude(p);
        const lng = safeGetLongitude(p);
        const distanceMeters = lat != null && lng != null ? haversineDistanceMeters(userLat, userLng, lat, lng) : Number.MAX_SAFE_INTEGER;

        const rating = (p.rating || p._rating || 0);
        const user_ratings_total = p.userRatingCount || p.user_ratings_total || p.user_ratings || 0;

        const types = p.types || p.category || [];
        const placeText = [name, vicinity, (p.description || ""), types.join(" "), (p.displayName && p.displayName.text) || ""].join(" ");

        const { matchScore, matchedKeywords } = computeMatchScore(visionLabels, placeText, types);

        const ratingWeight = rating * 3;
        const openBonus = (p.currentOpeningHours?.openNow || (p.opening_hours && p.opening_hours.open_now)) && preferOpenNow ? 1.5 : 0;
        const distancePenalty = (Math.min(distanceMeters, maxDistanceMeters) / 1000) * 0.4;

        const rawScore = ratingWeight + openBonus - distancePenalty;
        const score = rawScore + matchScore * 6;

        const photoUrl = p.photos?.length
          ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=400&key=${process.env.GOOGLE_PLACES_API_KEY}`
          : null;

        return {
          place_id: p.id || p.place_id || p.placeId || null,
          name: name || "Unknown",
          rating,
          user_ratings_total,
          vicinity,
          location: { latitude: lat, longitude: lng },
          opening_hours: p.currentOpeningHours || p.opening_hours || null,
          types,
          distanceMeters,
          photoUrl,
          score,
          matchScore,
          matchedKeywords,
          raw: p,
        };
      } catch (err) {
        console.warn("scoreAndFilterPlaces: single place failed:", err);
        return null;
      }
    })
    .filter(Boolean)
    .filter((p) => (p.rating >= minRating) && p.matchScore >= minMatchScore);

  mapped.sort((a, b) => b.score - a.score);
  return mapped;
}

module.exports = { scoreAndFilterPlaces, haversineDistanceMeters };
