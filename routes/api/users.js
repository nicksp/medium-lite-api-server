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

router.post('/users/login', (req, res, next) => {
  if (!req.boby.user.email) {
    return res.status(422).json({ errors: { email: 'can\'t be blank' }});
  }

  if (!req.boby.user.password) {
    return res.status(422).json({ errors: { password: 'can\'t be blank' }});
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      user.token = user.generateJwt();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

module.exports = router;
