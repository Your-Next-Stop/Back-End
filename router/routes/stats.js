const express = require('express');
const _ = require('underscore');
const { models } = require('../../database');

const router = new express.Router();

//* ****************************
// STATS PAGE
//* ****************************

router.get('/getStats', (req, res) => {
  const statsObj = {};
  statsObj.cities = [];
  statsObj.milesTraveled = 0;
  statsObj.numberOfCities = 0;
  const currently = new Date();
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserTrips.findAll({ where: { userId: user[0].id } }))
    .then(tripId => Promise.all(tripId.map(trip => models.Trips.findAll({
      where:
        { id: trip.tripId },
    }))))
    .then((tripArray) => {
      const previousTrips = tripArray.filter(trip => trip[0].dataValues.dateEnd < currently);
      previousTrips.forEach((prevTrip) => {
        const citiesArr = prevTrip[0].route.split(' -> ');
        statsObj.milesTraveled += prevTrip[0].milesTraveled;
        statsObj.cities.push(citiesArr);
      });
      statsObj.cities = _.uniq(_.flatten(statsObj.cities));
      statsObj.numberOfCities = statsObj.cities.length;
      statsObj.numberOfTrips = previousTrips.length;
    })
    .then(() => models.UserInterests.findAll({ where: { userId: req.query.id } }))
    .then((interests) => {
      const interestsObj = interests[0].dataValues;
      const interestsArr = [];
      for (const category in interestsObj) {
        interestsArr.push([category, interestsObj[category]]);
      }
      const sortedInterestsArray = interestsArr.sort((a, b) => b[1] - a[1]);
      const sortedArray = sortedInterestsArray.filter(interestArr => interestArr[0] !== 'id' && interestArr[0] !== 'userId');
      statsObj.top5Interests = sortedArray.map(arr => arr[0]).slice(0, 5);
      // sometimes you need to add .flat() to line 237
    })
    .then(() => {
      res.send(statsObj);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

module.exports.statsRouter = router;
