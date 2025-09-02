function toRadians(deg) { return (deg * Math.PI) / 180; }
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRadians(lat1))*Math.cos(toRadians(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


function scoreAndFilterPlaces(places = [], userLat, userLng, options = {}) {
  const {
    minRating = 3.0,
    maxPriceLevel = 3,
    preferOpenNow = true,
  } = options;

  const normalized = (places || [])
    .filter(p => p && p.rating) 
    .filter(p => (p.rating >= minRating))
    .filter(p => (p.price_level === undefined || p.price_level <= maxPriceLevel))
    .map(p => {
      const lat = p.geometry?.location?.lat;
      const lng = p.geometry?.location?.lng;
      const distanceMeters = (lat && lng) ? haversineDistanceMeters(userLat, userLng, lat, lng) : Number.MAX_SAFE_INTEGER;

      const ratingWeight = (p.rating || 0) * 3;
      const openBonus = (p.opening_hours && p.opening_hours.open_now) ? 1.5 : 0;
      const pricePenalty = (p.price_level !== undefined) ? p.price_level * 0.5 : 0;
      const distancePenalty = (distanceMeters / 1000) * 0.4; // per km penalty

      const score = ratingWeight + openBonus - pricePenalty - distancePenalty;

      return {
        place_id: p.place_id,
        name: p.name,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total,
        price_level: p.price_level,
        vicinity: p.vicinity || p.formatted_address,
        location: p.geometry?.location,
        opening_hours: p.opening_hours || null,
        types: p.types || [],
        distanceMeters,
        score,
        raw: p, 
      };
    });

  normalized.sort((a,b) => b.score - a.score);
  return normalized;
}

module.exports = { scoreAndFilterPlaces, haversineDistanceMeters };
