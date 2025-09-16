function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius of Earth in meters
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

function scoreAndFilterPlaces(
  places = [],
  userLat,
  userLng,
  visionLabels = [],
  options = {}
) {
  const {
    minRating = 2.0,
    maxPriceLevel = 3,
    preferOpenNow = true,
    minResults = 3, 
  } = options;



  let mapped = (places || [])
    .filter(p => p && p.rating)
    .map(p => {
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      const distanceMeters = lat && lng ? haversineDistanceMeters(userLat, userLng, lat, lng) : Number.MAX_SAFE_INTEGER;

      const ratingWeight = (p.rating || 0) * 3;
      const openBonus = p.currentOpeningHours?.openNow ? 1.5 : 0;
      const distancePenalty = (distanceMeters / 1000) * 0.4;
      const score = ratingWeight + openBonus - distancePenalty;

      const name = (p.displayName?.text || "").toLowerCase();
      const matchesLabel = visionLabels.some(label => name.includes(label.toLowerCase()));

      let photoUrl = null;
      if (p.photos && p.photos.length > 0) {
        const photoName = p.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      }

      return {
        place_id: p.id,
        name: p.displayName?.text || "Unknown",
        rating: p.rating,
        user_ratings_total: p.userRatingCount,
        vicinity: p.formattedAddress,
        location: p.location,
        opening_hours: p.currentOpeningHours || null,
        types: p.types || [],
        distanceMeters,
        photoUrl,
        score,
        matchesLabel,
        raw: p,
      };
    });

  // Step 2: Sort by label match first, then score
  mapped.sort((a, b) => {
    if (b.matchesLabel && !a.matchesLabel) return 1;
    if (a.matchesLabel && !b.matchesLabel) return -1;
    return b.score - a.score;
  });

  // Step 3: Ensure minimum results
  if (mapped.length < minResults) {
    const remaining = (places || [])
      .filter(p => !mapped.some(f => f.place_id === p.id))
      .map(p => {
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        const distanceMeters = lat && lng ? haversineDistanceMeters(userLat, userLng, lat, lng) : Number.MAX_SAFE_INTEGER;

        const ratingWeight = (p.rating || 0) * 3;
        const openBonus = p.currentOpeningHours?.openNow ? 1.5 : 0;
        const distancePenalty = (distanceMeters / 1000) * 0.4;
        const score = ratingWeight + openBonus - distancePenalty;

        let photoUrl = null;
        if (p.photos && p.photos.length > 0) {
          const photoName = p.photos[0].name;
          photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        }

        return {
          place_id: p.id,
          name: p.displayName?.text || "Unknown",
          rating: p.rating,
          user_ratings_total: p.userRatingCount,
          vicinity: p.formattedAddress,
          location: p.location,
          opening_hours: p.currentOpeningHours || null,
          types: p.types || [],
          distanceMeters,
          photoUrl,
          score,
          matchesLabel: false,
          raw: p,
        };
      });

    mapped.push(...remaining.slice(0, minResults - mapped.length));
  }

  return mapped;
}

module.exports = { scoreAndFilterPlaces, haversineDistanceMeters };
