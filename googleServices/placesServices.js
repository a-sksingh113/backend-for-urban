const axios = require('axios');

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) {
  console.warn('Warning: GOOGLE_PLACES_API_KEY not set');
}

async function findNearbyPlaces(location, keyword = '', radius = parseInt(process.env.DEFAULT_PLACES_RADIUS || '5000')) {
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const params = {
    key: PLACES_KEY,
    location: `${location.lat},${location.lng}`,
    radius,
    keyword,
    type: 'establishment',
  };

  try {
    const resp = await axios.get(url, { params });
    return resp.data;
  } catch (err) {
    console.error('placesService.findNearbyPlaces error:', err.response?.data || err.message || err);
    throw err;
  }
}


async function getPlaceDetails(placeId, fields = ['name','formatted_phone_number','website','formatted_address','opening_hours','rating','user_ratings_total']) {
  const url = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = {
    key: PLACES_KEY,
    place_id: placeId,
    fields: fields.join(','),
  };
  try {
    const resp = await axios.get(url, { params });
    return resp.data.result;
  } catch (err) {
    console.error('placesService.getPlaceDetails error:', err.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { findNearbyPlaces, getPlaceDetails };
