const express = require('express');
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorThrower = require('./utils/ErrorThrower');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files for post images and user images
app.use(
  '/uploads/postsImages',
  express.static(path.join(__dirname, 'uploads', 'postsImages'))
);
app.use(
  '/uploads/userImages',
  express.static(path.join(__dirname, 'uploads', 'userImages'))
);

// CORS settings
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);

// Error handler for unknown routes
app.all('*', (req, res, next) => {
  next(new ErrorThrower(`Can't find ${req.originalUrl} on this server!`, 404));
});

// app.use(errorController);

module.exports = app;
