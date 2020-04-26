/* eslint-disable camelcase */
const express = require('express');

const { GOOGLE_MAPS_API_KEY } = process.env;
const { models } = require('../../database');
const { getPlaceInfo } = require('../../helpers/index');

const router = new express.Router();

//* ****************************
// YOUR PLACES
//* ****************************

// Get info for a place
router.get('/getPlaceInfo', (req, res) => {
  const placeInfo = {};

  models.Places.findOne({
    where: { placeId: req.query.placeId, userId: req.query.userId },
  })
    .then((result) => {
      if (result) placeInfo.status = result.status;
      else placeInfo.status = false;
    })
    .then(() => getPlaceInfo(req.query.placeId))
    .then((response) => {
      const {
        // eslint-disable-next-line camelcase
        formatted_address, formatted_phone_number, icon, name, business_status,
        place_id, price_level, rating, url, website, photos, types, geometry,
      } = response.data.result;
      Object.assign(placeInfo, {
        address: formatted_address,
        coordinates: geometry.location,
        phone: formatted_phone_number || 'No phone number available',
        icon,
        name,
        hours: 'Call for Hours',
        open: business_status,
        category: types[0],
        placeId: place_id,
        // eslint-disable-next-line camelcase
        priceLevel: price_level || Math.floor(Math.random() * 5),
        rating: Math.round(100 * rating) / 100,
        GoogleMapsUrl: url || photos[0].html_attributions[0],
        website: website || 'No website available',
        // photo: photos[0].photo_reference || icon,
      });

      const photoRef = photos[0].photo_reference;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`;
    })
    .then((imgUrl) => {
      placeInfo.photo = imgUrl;
      res.send(placeInfo);
    })
    .catch(err => console.error(err));
});

//  POST /saveForLater
// when something is saved for later - save to places
// under user places set status to 'saved'
router.post('/saveForLater', (req, res) => models.Places.findOrCreate({
  where: {
    name: req.body.name,
    userId: req.body.userId,
    status: 'saved',
  },
}).then(response => res.send(response))
  .catch((err) => {
    console.error('Err trying to save this place in the database', err);
    res.status(400).send(err);
  }));

//  GET a user's places for Places page
router.get('/getLikedAndSavedForLater', (req, res) => {
  const placesObj = {};
  placesObj.savedPlaces = [];
  placesObj.likedPlaces = [];
  models.Places.findAll({ where: { userId: req.query.id } })
    .then((response) => {
      response.forEach((place) => {
        if (place.status === 'saved') {
          placesObj.savedPlaces.push(place);
        } else {
          placesObj.likedPlaces.push(place);
        }
      });
      res.send(placesObj);
    })
    .catch((err) => {
      console.error('Err trying to get user places from the database', err);
      res.status(400).send(err);
    });
});


module.exports.yourPlacesRouter = router;
