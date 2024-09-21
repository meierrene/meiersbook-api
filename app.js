const express = require('express');
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
const ErrorThrower = require('./utils/ErrorThrower');
// const errorController = require('./controllers/errorController');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(
  '/uploads/postsImages/',
  express.static(path.join('uploads', 'postsImages'))
);

app.use(
  '/uploads/profilesImages/',
  express.static(path.join('uploads', 'profilesImages'))
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);

app.all('*', (req, res, next) => {
  next(new ErrorThrower(`Can't find ${req.originalUrl} on this server!`, 404));
});

// app.use(errorController);

module.exports = app;
