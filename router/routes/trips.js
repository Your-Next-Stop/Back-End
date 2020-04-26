/* eslint-disable no-param-reassign */
/* eslint-disable array-callback-return */
const express = require('express');
const { models } = require('../../database');

const router = new express.Router();


//* ****************************
// TRIPS
//* ****************************

// add a trip to the database
router.post('/addTrip', (req, res) => {
  const stringifiedWayPoints = JSON.stringify(req.body.waypoints);
  const milesTraveledNum = Math.round(Number(req.body.milesTraveled.split(' ')[0].replace(/,/g, '')));
  return models.Trips.findOrCreate({
    where: {
      id: req.body.tripId || 0,
    },
    defaults: {
      route: req.body.route,
      dateStart: req.body.dateStart,
      dateEnd: req.body.dateEnd,
      wayPoints: stringifiedWayPoints,
      milesTraveled: milesTraveledNum,
    },
  }).then((trip) => {
    if (trip[1] === false) {
      models.Trips.update(
        {
          route: req.body.route,
          dateStart: req.body.dateStart,
          dateEnd: req.body.dateEnd,
          wayPoints: stringifiedWayPoints,
          milesTraveled: milesTraveledNum,
        },
        { where: { id: trip[0].dataValues.id } },
      );
    }
    const tripData = trip[0].dataValues;
    tripData.wayPoints = stringifiedWayPoints;
    models.UserTrips.findOrCreate({
      where: {
        userId: req.body.userId,
        tripId: tripData.id,
      },
    });
    res.send(tripData);
  })
    .catch((err) => {
      console.error('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});

// remove a trip from the database
router.post('/removeTrip', (req, res) => {
  models.UserTrips.destroy({
    where: {
      tripId: req.body.id,
    },
  }).then(() => {
    models.Trips.destroy({
      where: {
        id: req.body.id,
      },
    })
      .then(() => {
        res.send({ deleted: true });
      });
  }).catch((err) => {
    console.error(err);
    res.status(500).send(err);
  });
});

// gets all users past, current, and previous trips
router.get('/getAllUsersTrips', (req, res) => {
  models.Users.findAll({ where: { id: req.query.id } })
    .then(user => models.UserTrips.findAll({ where: { userId: user[0].id } }))
    .then(tripId => Promise.all(tripId.map(trip => models.Trips.findAll({
      where: { id: trip.tripId },
    }))))
    .then((tripArray) => {
      tripArray.map((trip) => {
        const currently = new Date();
        if (trip[0].dataValues.dateStart < currently && trip[0].dataValues.dateEnd > currently) {
          trip[0].dataValues.status = 'current';
        } else if (trip[0].dataValues.dateStart > currently) {
          trip[0].dataValues.status = 'upcoming';
        } else if (trip[0].dataValues.dateEnd < currently) {
          trip[0].dataValues.status = 'previous';
        }
        trip[0].dataValues.wayPoints = JSON.parse(trip[0].dataValues.wayPoints);
      });
      res.status(200).send(tripArray);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});


module.exports.tripsRouter = router;
