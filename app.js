const fs = require('fs');
const http = require('http');
const path = require('path');
const cors = require('cors');
const methods = require('methods');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const errorhandler = require('errorhandler');
const mongoose = require('mongoose');

const isProduction = process.env.NODE_ENV === 'production';

// Create global app object
const app = express();
const db = mongoose.connection;

const host = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
const port = process.env.PORT || 2017;

// App configuration

// Configure our app to handle CORS requests
app.use(cors());

// Use native promises
mongoose.Promise = global.Promise;

// Use body parser, so we can grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/assets', express.static(path.join(__dirname, 'public')));

// Log all requests to the console
app.use(morgan('dev'));

app.use(require('method-override')());

app.use(session({
  secret: 'medium-lite',
  cookie: { maxAge: 60000 },
  resave: false,
  saveUninitialized: false
}));

if (!isProduction) {
  app.use(errorhandler());
}

// DB connection handlers
db.on('error', (error) => {
  console.error('Mongoose connection: ERROR');
  throw new Error(error);
});

db.on('open', () => {
  console.error('Mongoose connection: OPEN');
});

// Connect to our database
if (isProduction) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://localhost/ledium');
  mongoose.set('debug', true);
}

// Models
require('./models/User');
require('./models/Article');
require('./models/Comment');

// Services
require('./services/passport');

// App routes
app.use(require('./routes'));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler: will print stacktrace
if (!isProduction) {
  app.use((err, req, res, next) => {
    console.log(err.stack);

    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

// Production error handler: no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

// Start the server
app.listen(port, host, () => console.log(`API server running at ${host}:${port}/api`));
