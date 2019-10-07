require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { db, models } = require('./database');
const { getNearbyPlaces, getPositions, getPlacePhoto } = require('./API-helpers');

const app = express();

app.use(express.json());
app.use(cors());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Contorl-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    console.log(`${req.ip} ${req.method} ${req.url}`);
    next();
  }
});

app.get('/', (req, res) => {
  res.send({ message: 'HELLO WORLD' });
});


//* ****************************
// USERS
//* ****************************

// add a user to the users table
// app.post('/users', (req, res) => {
//   console.log('req.bodyyyy', req.body);
//   models.Users.create(req.body)
//     .then((user) => {
//       res.send(user);
//     }).catch((err) => {
//       console.log('Err trying to create the user in the database', err);
//       res.status(400).send(err);
//     });
// });

// passport.use(new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: "http://yourdomain:3000/auth/google/callback",
//   passReqToCallback: true
// },
//   function (request, accessToken, refreshToken, profile, done) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return done(err, user);
//     });
//   }
// ));


//* ****************************
// TRIPS
//* ****************************

// get all trips from the database
app.get('/getAllTrips', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Trips.findAll()
    .then((trips) => {
      const tripsArray = trips;
      // console.log(tripsArray);
      res.send(tripsArray);
    }).catch((err) => {
      console.log('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});


// add a trip to the database
app.post('/addTrip', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Trips.create(req.body)
    .then((trip) => {
      const tripData = trip.dataValues;
      console.log(tripData);
      res.send(tripData);
    }).catch((err) => {
      console.log('Err trying to create the trip in the database', err);
      res.status(400).send(err);
    });
});


//* ****************************
// CITIES
//* ****************************

//* ****************************
// INTERESTS
//* ****************************

//* ****************************
// VISTITED PLACES
//* ****************************

//GET NEARBY PLACES

app.get('/nearbyPlaces', (req, res) => {
  getNearbyPlaces(req.query.location)
    .then((response) => {
      console.log(response)
      const locations = response.json.results.map(place => {
        return {
          name: place.name,
          placeId: place.place_id,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          photos: place.photos[0].photo_reference,
          address: place.vicinity,
          icon: place.icon,
          priceLevel: place.price_level,
          rating: place.rating
        }
      })
      res.status(200).send(locations);
    })
    .catch((err) => {
      console.warn(err);
      res.status(500).send(err);
    })
})

app.get('/routePositions', (req, res) => {
  getPositions(req.query)
    .then(coords => {
      console.log(coords)
      res.status(200).send(coords);
    })
    .catch(err => console.error(err))
})
const PORT = 4201;

app.get('/placePhoto', (req, res) => {
  getPlacePhoto(req.query)
    .then(photo => {
      console.log(photo)
      res.status(200).set('Content-Type', 'image/gif').write(photo.readableBuffer.head.data)})
    .catch(err => console.error(err))
})
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
