const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { models } = require('../../database');

const {
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_CALLBACK_URL, FRONTEND_BASE_URL,
  SESSION_SECRET,
} = process.env;

const router = new express.Router();

router.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
}));
router.use(passport.initialize());
router.use(passport.session());


//* ****************************
// GOOGLE SIGN UP
//* ****************************
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CLIENT_CALLBACK_URL,
},
((accessToken, refreshToken, profile, cb) => {
  models.Users.findOrCreate({
    where: { googleId: profile.id },
    defaults: { username: profile.displayName },
  })
    .then(([user]) => {
      cb(null, user);
    })
    .catch(error => cb(null, error));
})));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  models.Users.findById(id, (err, user) => {
    done(err, user);
  });
});

//* ****************************
// LOGIN
//* ****************************
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_BASE_URL}` }),
  (req, res) => {
    // Successful authentication, redirect to explore page.
    res.redirect(`${FRONTEND_BASE_URL}/explore?id=${req.user.id}`);
  });


module.exports.authRouter = router;
