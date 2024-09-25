const express = require('express');
const cors = require('cors');
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorThrower = require('./utils/ErrorThrower');
const path = require('path');
const app = express();

// CORS Configuration
const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? 'https://meiersbook.renemeier.info'
    : 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
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
