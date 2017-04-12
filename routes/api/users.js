const mongoose = require('mongoose');
const router = require('express').Router();
const passport = require('passport');

const User = mongoose.model('User');
const auth = require('../auth');

// User registration
router.post('/users', (req, res, next) => {
  const user = new User();
  const { username, email, password } = req.body.user;

  user.username = username;
  user.email = email;
  user.setPassword(password);

  user.save()
    .then(() => {
      return res.json({ user: user.toAuthJSON() });
    }).catch(next);
});

module.exports = router;
