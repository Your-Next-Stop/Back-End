require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const {
  authRouter, interestsRouter, nearbyPlacesRouter, yourPlacesRouter,
  routesRouter, tripsRouter, statsRouter,
} = require('./router/index');

const PORT = process.env.PORT || 4201;

const app = express();

app.use(express.static(path.join(__dirname, '../your-next-stop/dist/your-next-stop')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// http routes
app.use(authRouter);
app.use(interestsRouter);
app.use(nearbyPlacesRouter);
app.use(yourPlacesRouter);
app.use(routesRouter);
app.use(tripsRouter);
app.use(statsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
