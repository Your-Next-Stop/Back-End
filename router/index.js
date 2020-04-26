const { authRouter } = require('./routes/auth');
const { interestsRouter } = require('./routes/interests');
const { nearbyPlacesRouter } = require('./routes/nearby-places');
const { yourPlacesRouter } = require('./routes/your-places');
const { routesRouter } = require('./routes/route');
const { tripsRouter } = require('./routes/trips');
const { statsRouter } = require('./routes/stats');

const routers = {
  authRouter,
  interestsRouter,
  nearbyPlacesRouter,
  yourPlacesRouter,
  routesRouter,
  tripsRouter,
  statsRouter,
};

module.exports = routers;
