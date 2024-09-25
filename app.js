const express = require('express');
const cors = require('cors');
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorThrower = require('./utils/ErrorThrower');
const path = require('path');
const app = express();

// CORS Configuration
app.use(
  cors({
    origin: process.env.WEBSITE,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files (for uploaded images, etc.)
app.use('/uploads/', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);

// Handle unknown routes
app.all('*', (req, res, next) => {
  next(new ErrorThrower(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
