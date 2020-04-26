/* eslint-disable no-param-reassign */
const express = require('express');
const {
  getAutocompleteAddress, getDistanceMatrix, getPositions,
  findPointsByDirections, getLocationsNearPoints,
} = require('../../helpers/index');

const router = new express.Router();

// auto complete typed address in route form
router.get('/autocompleteAddress', (req, res) => {
  getAutocompleteAddress(req.query)
    .then((suggestion) => {
      const filterSuggestions = suggestion.json.predictions.map(place => place.description);
      res.status(200).send(filterSuggestions);
    })
    .catch(err => console.error(err));
});

// populate route-page map with coordinates
router.get('/routePositions', (req, res) => {
  getPositions(req.query)
    .then((coords) => {
      const filtered = coords.map((location, index) => {
        if (index < 2) {
          return {
            lat: location.json.results[0].geometry.location.lat,
            lng: location.json.results[0].geometry.location.lng,
            placeId: location.json.results[0].place_id || 'no id',
          };
        }
        return {
          location: {
            lat: location.json.results[0].geometry.location.lat,
            lng: location.json.results[0].geometry.location.lng,
            placeId: location.json.results[0].place_id || 'no id',
          },
        };
      });
      res.status(200).send(filtered);
    })
    .catch(err => console.error(err));
});

// get estimated time duration for trip
router.get('/eta', (req, res) => {
  const query = {
    origin: req.query.origin_addresses,
    destination: req.query.destination_addresses,
    waypoints: req.query.waypoints,
  };
  getDistanceMatrix(query)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch(err => console.error(err));
});

router.get('/routeSuggestions', (req, res) => {
  const { loc1, loc2, category } = req.query;
  const [loc1Lat, loc1Lng, loc2Lat, loc2Lng] = [...loc1.split(','), ...loc2.split(',')].map(num => Number(num));
  getLocationsNearPoints(loc1Lat, loc1Lng, loc2Lat, loc2Lng, category)
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
});

// optimized route with waypoints
router.get('/routeDirectionsSuggestions', (req, res) => {
  const {
    loc1, loc2, waypoints, category,
  } = req.query;
  findPointsByDirections(loc1, loc2, waypoints, category)
    .then((suggestions) => {
      const formattedSuggestions = [];
      suggestions.forEach(locations => locations.forEach((location, index) => {
        switch (index) {
          case 0: location.zoomLevel = 1; break;
          case 1: location.zoomLevel = 6; break;
          case 2: location.zoomLevel = 6; break;
          case 3: location.zoomLevel = 7; break;
          case 4: location.zoomLevel = 7; break;
          case 5: location.zoomLevel = 8; break;
          case 6: location.zoomLevel = 8; break;
          case 7: location.zoomLevel = 9; break;
          case 8: location.zoomLevel = 9; break;
          default: location.zoomLevel = 10; break;
        }
        formattedSuggestions.push(location);
      }));
      res.status(200).send(formattedSuggestions);
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
});


module.exports.routesRouter = router;
