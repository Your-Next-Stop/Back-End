const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;
const { util } = require('@google/maps');
const googleMapsClient = require('@google/maps').createClient({
  key: GOOGLE_MAPS_API_KEY,
  Promise,
});
const { findPoints } = require('./pointsCalculator');

const getAutocompleteAddress = (query) => {
  const options = {
    input: query.input,
    components: { country: 'us' },
  };
  if (query.location.length) {
    options.location = query.location;
    options.radius = 10000;
  }
  return googleMapsClient.placesAutoComplete(options).asPromise();
};

const getPositions = (addresses) => {
  const allPromises = [];
  allPromises.push(googleMapsClient.geocode({ address: addresses.origin }).asPromise());
  allPromises.push(googleMapsClient.geocode({ address: addresses.destination }).asPromise());

  if (addresses.waypoints) {
    const waypoints = addresses.waypoints.split(';');
    waypoints
      .filter(waypoint => !!waypoint)
      .forEach(waypoint => allPromises.push(googleMapsClient.geocode({ address: waypoint }).asPromise()));
  }
  return Promise.all(allPromises);
};

const getLocationsNearPoints = (loc1Lat, loc1Lng, loc2Lat, loc2Lng, category) => {
  const points = findPoints(loc1Lat, loc1Lng, loc2Lat, loc2Lng);

  const promisePoints = points.map((point) => {
    const options = {
      // location: `29.96768435314543,-90.05025405587452`,
      key: GOOGLE_MAPS_API_KEY,
      location: `${point.lat},${point.lng}`,
      input: category,
      inputtype: 'textquery',
      opennow: false,
      radius: 50000,
      fields: 'photos,place_id,formatted_address,geometry,name,rating',
      locationbias: `circle:50000@${point.lat},${point.lng}`,
    };

    return axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: options,
    })
      .then((places) => {
        const place = places.data.candidates[0];
        const responseFields = {
          clicked: false,
          name: place.name,
          placeId: place.place_id,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address: place.formatted_address,
          rating: place.rating,
          interest: options.input,
        };
        return Promise.resolve(responseFields);
      });
  });
  return Promise.all(promisePoints);
};

const findPointsByDirections = (origin, destination, waypoints, category) => {
  const query = { origin, destination };
  if (waypoints) {
    query.waypoints = waypoints.split(';').filter(a => a);
  }
  let routeInfo;

  return googleMapsClient.directions(query).asPromise()
    .then((result) => {
      let distanceString = '';
      for (const letter of result.json.routes[0].legs[0].distance.text) {
        if (Number(letter) > -1) distanceString += letter;
      }
      const distance = Number(distanceString);
      let divisor;
      // if (distance > 500) divisor = 10;
      // else divisor = Math.round(distance / 50);
      divisor = Math.round(distance / 50);

      const polyline = result.json.routes[0].overview_polyline.points;
      const decodedPolyline = util.decodePath(polyline);
      const loopIncrement = Math.round(decodedPolyline.length / divisor);
      const searchPoints = [];
      for (let i = loopIncrement; i < decodedPolyline.length; i += loopIncrement) {
        searchPoints.push(decodedPolyline[i]);
      }
      routeInfo = {
        distance: result.json.routes[0].legs[0].distance.text,
        duration: result.json.routes[0].legs[0].duration.text,
        searchPoints,
      };
      const searchPromises = searchPoints.map((point) => {
        const location = `${point.lat},${point.lng}`;
        const options = {
          location,
          keyword: category,
          opennow: false,
          radius: 50000,
        };
        return googleMapsClient.placesNearby(options).asPromise();
      });
      return Promise.all(searchPromises);
    })
    .then((routeSuggestions) => {
      const filteredSuggestions = routeSuggestions.map(places => places.json.results.map(place => ({
        clicked: false,
        name: place.name,
        placeId: place.place_id,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.vicinity,
        rating: place.rating,
        interest: category,
        zoomLevel: 0,
      })).slice(0, 10).sort((a, b) => b.rating - a.rating));
      return Promise.resolve(filteredSuggestions);
    });
};


module.exports.getAutocompleteAddress = getAutocompleteAddress;
module.exports.getPositions = getPositions;
module.exports.getLocationsNearPoints = getLocationsNearPoints;
module.exports.findPointsByDirections = findPointsByDirections;
