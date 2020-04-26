const { getNearbyPlaces, getPlacePhoto, getYelpPhotos, getPlaceInfo } = require('./functions/placeHelpers');
const { getAutocompleteAddress, getPositions, getLocationsNearPoints, findPointsByDirections } = require('./functions/routeHelpers');
const { middlePoint, findPoints } = require('./functions/pointsCalculator');
const { getDistanceMatrix } = require('./functions/tripHelpers');

const helpers = {
  getNearbyPlaces,
  getPlacePhoto,
  getYelpPhotos,
  getPlaceInfo,
  getAutocompleteAddress,
  getPositions,
  getLocationsNearPoints,
  findPointsByDirections,
  getDistanceMatrix,
  middlePoint,
  findPoints,
};

module.exports = helpers;
