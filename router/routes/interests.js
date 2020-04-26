const express = require('express');
const { models } = require('../../database');

const router = new express.Router();

//* ****************************
// INTERESTS
//* ****************************

// likes an interest
router.post('/likedInterest', (req, res) => {
  const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.userId },
  })
    .then((instance) => {
      instance.increment(field);
      const city = `${req.body.address.split(', ')[1]} ${req.body.address.split(', ')[2]}`;
      console.log(req.body);
      return models.Places.findOrCreate({
        where: {
          placeId: req.body.placeId,
          userId: req.body.userId,
        },
        defaults: {
          name: req.body.name,
          coords: JSON.stringify(req.body.coordinates),
          hours: req.body.hours || null,
          city,
          address: req.body.address.split(',')[0],
          placeId: req.body.placeId,
          priceLevel: req.body.priceLevel,
          rating: req.body.rating,
          website: req.body.website,
          phone: req.body.phone,
          // photo: imgUrl,
          photo: req.body.photoRef,
          userId: req.body.userId,
          status: req.body.status,
        },
      });
    })
    .then((result) => {
      if (!result[1]) {
        return models.Places.update({ status: req.body.status }, {
          where: {
            name: req.body.name,
            userId: req.body.userId,
          },
        });
      }
      res.status(200);
    })
    .then(() => {
      res.status(200);
    })
    .catch((err) => {
      console.error(err);
    });
});

// unlike a liked interest
router.delete('/likedInterest', (req, res) => {
  models.Places.destroy({
    where: {
      userId: req.query.userId,
      placeId: req.query.placeId,
    },
  })
    .then(() => {
      res.status(202);
    })
    .catch(err => console.error(err));
});

// dislike an interest
router.post('/dislikedInterest', (req, res) => {
  const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.id },
  })
    .then(instance => instance.decrement(field))
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      console.error(err);
    });
});

// deletes interest
router.post('/deleteInterest', (req, res) => {
  // const field = req.body.interest;
  models.UserInterests.findOne({
    where: { userId: req.body.id },
  })
    .then((instance) => {
      const field = req.body.interest;
      instance.decrement([field], { by: 50 });
    })
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      console.error(err);
    });
});


module.exports.interestsRouter = router;
