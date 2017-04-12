const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

const User = mongoose.model('User');

// Setup options for Local Strategy
const localOptions = {
  usernameField: 'user[email]',
  passwordField: 'user[password]'
};

// Creare local strategy
passport.use(new LocalStrategy(localOptions, (email, password, done) => {
  // Verify this email and password, call done with the user
  // if it is the correct email and password
  // otherwise, call done with false
  User.findOne({ email }, (err, user) => {
    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false, { errors: { 'email': 'Incorrect username.' }});
    }

    if (!user.isValidPassword(password)) {
      return done(null, false, { errors: { 'password': 'Incorrect password.' }})
    }

    return done(null, user);
  });
}));
