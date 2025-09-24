const axios = require("axios");
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) console.warn("Warning: GOOGLE_PLACES_API_KEY not set");

// async function findNearbyPlaces(location, textQuery, radius) {
//   const url = "https://places.googleapis.com/v1/places:searchText";

//   const body = {
//     textQuery: textQuery || "shop",
//     locationBias: {
//       circle: {
//         center: {
//           latitude: parseFloat(location.lat),
//           longitude: parseFloat(location.lng),
//         },
//         radius: radius,
//       },
//     },
//   };

//   try {
//     const resp = await axios.post(url, body, {
//       headers: {
//         "Content-Type": "application/json",
//         "X-Goog-Api-Key": PLACES_KEY,
//         "X-Goog-FieldMask":
//           "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types",
//       },
//     });

//     const places = resp.data.places || [];
//     console.log("[Places Debug] query:", textQuery, "results:", places.length);
//     if (places.length > 0) {
//       console.log("[Places Debug] Sample:", JSON.stringify(places.slice(0,3), null, 2));
//     } else {
//       console.log("[Places Debug] No places returned for query:", textQuery);
//     }

//     return { places, raw: resp.data };
//   } catch (err) {
//     console.error("findNearbyPlaces error:", err.response?.data || err.message || err);
//     throw err;
//   }
// }

async function getPlaceDetails(
  placeId,
  fields = [
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
    "types",
  ]
) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const resp = await axios.get(url, {
      headers: {
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": fields.join(","),
      },
    });
    return resp.data;
  } catch (err) {
    console.error(
      "getPlaceDetails error:",
      err.response?.data || err.message || err
    );
    throw err;
  }
}

// Calculate distance between two coordinates in meters
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
};

// Find nearby places and enrich with details, distance, availability
const findNearbyPlaces = async (query, lat, lng, radius) => {
  if (!PLACES_KEY) throw new Error("Missing GOOGLE_PLACES_API_KEY");

  const locationBias =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? {
          locationBias: {
            circle: { center: { latitude: lat, longitude: lng }, radius },
          },
        }
      : undefined;

  const body = { textQuery: query, pageSize: 5, ...locationBias };

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.googleMapsUri",
          "places.photos",
          "places.types",
        ].join(","),
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places search failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const places = (json.places || []).slice(0, 3);

  const enriched = [];
  for (const p of places) {
    const details = await getPlaceDetails(p.id);

    // Correctly read location
    const distance =
      details.location?.latitude != null && details.location?.longitude != null
        ? haversineDistance(
            lat,
            lng,
            details.location.latitude,
            details.location.longitude
          )
        : null;

    if (distance !== null && distance > radius) {
      continue;
    }

    const availability =
      details.currentOpeningHours?.openNow === true
        ? "Open"
        : details.currentOpeningHours?.openNow === false
        ? "Closed"
        : "Unknown";

    let photoUrl = null;
    if (details.photos?.length > 0) {
      photoUrl = `https://places.googleapis.com/v1/${details.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${PLACES_KEY}`;
    }

    enriched.push({
      id: details.id,
      name: details.displayName?.text,
      address: details.formattedAddress,
      rating: details.rating,
      reviews: details.userRatingCount,
      phone: details.internationalPhoneNumber,
      website: details.websiteUri,
      maps: details.googleMapsUri,
      photo: photoUrl,
      types: details.types || [],
      distance,
      availability,
    });
  }

  return enriched;
};

module.exports = { findNearbyPlaces, getPlaceDetails };
