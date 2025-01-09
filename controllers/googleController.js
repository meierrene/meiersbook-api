const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken } = require('../utils/passport');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const googleCallback = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Authorization code missing' });
  }

  try {
    // Exchange authorization code for tokens with the redirect URI
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${process.env.WEBSITE}/auth/google/callback`, // Ensure this matches your registered redirect URI
    });

    // Verify ID token to get user information
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Find or create the user in the database
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture,
        role: 'user',
      });
    }

    // Generate a JWT for the user
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: 'success',
      token: jwtToken,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ status: 'error', message: 'Google login failed' });
  }
};

const createUserFromGoogle = async (req, res) => {
  const { token } = req.body;

  try {
    const googleUser = await verifyGoogleToken(token);

    if (!googleUser)
      return res.status(401).json({ status: 'fail', message: 'Invalid token' });

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        image: googleUser.picture,
        role: 'user',
      });

      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
    };

    res.status(200).json({
      status: 'success',
      token: jwtToken,
      data: userData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

module.exports = {
  createUserFromGoogle,
  googleCallback,
};
