const axios = require("axios");

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) {
  console.warn("Warning: GOOGLE_PLACES_API_KEY not set");
}


async function findNearbyPlaces(location, keyword, radius) {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: keyword || "shop",
    locationBias: {
      circle: {
        center: {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lng),
        },
        radius: radius, 
      },
    },
  };

  try {
    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos",
      },
    });

    const places = resp.data.places || [];
 

    if (places.length > 0) {
      console.log(
        "[Places Debug] Sample Results:",
        JSON.stringify(places.slice(0, 3), null, 2)
      );
    } else {
      console.log("[Places Debug] No places returned by API");
    }

    return resp.data;
  } catch (err) {
    console.error(
      "findNearbyPlaces error:",
      err.response?.data || err.message || err
    );
    throw err;
  }
}

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

module.exports = { findNearbyPlaces, getPlaceDetails };
