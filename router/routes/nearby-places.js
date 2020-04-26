/* eslint-disable no-param-reassign */
const express = require('express');
const throttledQueue = require('throttled-queue');

const { GOOGLE_MAPS_API_KEY } = process.env;
const { getNearbyPlaces, getYelpPhotos, getPlacePhoto } = require('../../helpers/index');
const { models } = require('../../database');

const router = new express.Router();

//* ****************************
// NEARBY PLACES
//* ****************************

// GET ALL NEARBY PLACES
// this endpoint should hit when SHOW ALL RESULTS button is clicked in the Explore page
// returns an array of arrays where each array contains a bunch of objects: [[{}, {}, ...], ...]
// each inner array represets an interest while each object is a nearby place
router.get('/nearbyPlaces', (req, res) => {
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserInterests.findOrCreate({ where: { userId: user[0].id } }))
    .then((interests) => {
      const interestsObj = interests[0].dataValues;
      const interestsArr = [];
      for (const category in interestsObj) {
        interestsArr.push([category, interestsObj[category]]);
      }
      const sortedInterestsArray = interestsArr.sort((a, b) => b[1] - a[1]);
      const sortedArray = sortedInterestsArray.filter(interestArr => interestArr[0] !== 'id' && interestArr[0] !== 'userId');
      return sortedArray.map(arr => arr[0]);
      // sometimes you need to add .flat() to line 344
    })
    .then(sortedInterestsArr => Promise.all(getNearbyPlaces(
      req.query.location, sortedInterestsArr, req.query.snapshotUrl,
    )))
    .then((response) => {
      let filteredRes = [];
      if (req.query.snapshotUrl === '/results') {
        const filteredArr = response.filter(arr => arr.length > 1);
        filteredArr.forEach((interestArr) => {
          interestArr.forEach((placeObj) => {
            const imageRef = placeObj.photos;
            const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${imageRef}&key=${GOOGLE_MAPS_API_KEY}`;
            placeObj.photoUrl = imageUrl;
          });
        });
        filteredRes = filteredArr;
      } else {
        response.forEach((interestArr) => {
          for (let i = 0; i < interestArr.length; i += 1) {
            if (i > 3) break;
            filteredRes.push(interestArr[i]);
          }
        });
      }
      res.status(200).send(filteredRes);
    })
    .catch((err) => {
      console.error(err);
    });
});

// get photos for nearby places
const throttle = throttledQueue(1, 300);
router.get('/yelpAPI', (req, res) => {
  const coordinates = {
    lat: req.query.latitude,
    lng: req.query.longitude,
    term: req.query.name,
  };
  throttle(() => {
    getYelpPhotos(coordinates)
      .then((response) => {
        const filteredRes = {
          photos: [response.data.image_url].concat(response.data.photos),
          name: response.data.name,
          phone: response.data.phone,
        };
        res.status(200).send(filteredRes);
      })
      .catch(err => console.error(err));
  });
});

// filter places by selected category
router.get('/nearbyPlacesByCategory', (req, res) => {
  Promise.all(getNearbyPlaces(req.query.location, req.query.category))
    .then((result) => {
      const filteredRes = result[0].slice(0, 12);
      res.status(200).send(filteredRes);
    })
    .catch(err => console.error(err));
});

// another endpoint for getting photos
router.get('/placePhoto', (req, res) => {
  getPlacePhoto(req.query)
    .then((photo) => {
      res.set('Content-Type', photo.headers['content-type']);
      res.status(200).send(Buffer.from(photo.data, 'base64'));
    })
    .catch(err => console.error(err));
});


module.exports.nearbyPlacesRouter = router;
