const axios = require('axios');

const { YELP_API_KEY } = process.env;
const { GOOGLE_MAPS_API_KEY } = process.env;
const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});

// sends request to Google Places API for nearby places
const getNearbyPlaces = (location, interests, snapshotUrl) => {
  let newInterests;
  if (typeof interests === 'string') newInterests = [interests];
  else if (snapshotUrl === '/results') {
    newInterests = interests.slice(0, 10);
  } else {
    newInterests = interests.slice(0, 3);
  }

  const usersNearbyPlaces = newInterests.map((interest) => {
    const options = {
      // location: `29.96768435314543,-90.05025405587452`,
      location,
      keyword: `${interest}`,
      opennow: false,
      rankby: 'distance',
    };
    return googleMapsClient
      .placesNearby(options)
      .asPromise()
      .then((response) => {
        const filteredLocations = response.json.results.filter(place => place.photos);
        const locations = filteredLocations.slice(0, 10).map((place) => {
          const category = options.keyword;
          const categories = (category.slice(-1) === 'y') ? `${category.substring(0, category.length - 1)}ies` : `${category}s`;
          const cityAndState = `${place.plus_code.compound_code.split(' ')[1]} ${place.plus_code.compound_code.split(' ')[2]} ${place.plus_code.compound_code.split(' ')[3]}`;
          const responseFields = {
            clicked: false,
            name: place.name,
            placeId: place.place_id,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            city: cityAndState,
            address: place.vicinity,
            icon: place.icon,
            priceLevel: place.price_level,
            rating: place.rating,
            interest: categories,
            photos: place.photos[0].photo_reference,
          };

          const interestArr = [];
          responseFields.interest.split('_').forEach(((word) => {
            interestArr.push(word[0].toUpperCase().concat(word.slice(1)));
          }));
          responseFields.interest = interestArr.join(' ');
          return responseFields;
        });
        return locations;
      })
      .catch((err) => {
        console.error(err);
        res.status(500);
      });
  });
  return usersNearbyPlaces;
};

// converts image buffer from Google Places API into actual image
const getPlacePhoto = (photoRef) => {
  const options = {
    key: GOOGLE_MAPS_API_KEY,
    photoreference: photoRef.ref,
    maxheight: 200,
  };

  return axios.get('https://maps.googleapis.com/maps/api/place/photo', {
    responseType: 'arraybuffer',
    params: options,
  });
};

const getYelpPhotos = (coordinates) => {
  const options = {
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    term: coordinates.term,
    radius: 500,
  };
  const headers = {
    Authorization: `Bearer ${YELP_API_KEY}`,
  };
  return axios.get('https://api.yelp.com/v3/businesses/search', { params: options, headers })
    .then((response) => {
      if (response.data.businesses[0] === undefined) {
        const emptyRes = {
          data: {
            img_url: 'http://www.moxmultisport.com/wp-content/uploads/no-image.jpg',
            name: 'Something went wrong',
            phone: 'unknown',
          },
        };
        return Promise.resolve(emptyRes);
      }
      const { id } = response.data.businesses[0];
      return axios.get(`https://api.yelp.com/v3/businesses/${id}`, { headers });
    });
};

const getPlaceInfo = (placeId) => {
  const options = {
    key: GOOGLE_MAPS_API_KEY,
    place_id: placeId,
  };
  return axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
    params: options,
  });
};


module.exports.getNearbyPlaces = getNearbyPlaces;
module.exports.getPlacePhoto = getPlacePhoto;
module.exports.getYelpPhotos = getYelpPhotos;
module.exports.getPlaceInfo = getPlaceInfo;
