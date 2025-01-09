const express = require('express');
const {
  createUserFromGoogle,
  googleCallback,
} = require('../controllers/googleController');
const router = express.Router();
const passport = require('passport');

// Route for exchanging Google token
router.post('/', createUserFromGoogle);

// Route for initiating Google login
router.get(
  '/login',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Route for handling Google callback
router.post('/callback', googleCallback);

module.exports = router;
