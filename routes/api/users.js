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
    })
    .catch(next);
});

// User login
router.post('/users/login', (req, res, next) => {
  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: 'can\'t be blank' }});
  }

  if (!req.body.user.password) {
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

// Fetch and update user's details
router.route('/user')
  .get(auth.required, (req, res, next) => {
    User.findById(req.payload.id)
      .then(user => {
        if (!user) {
          return res.sendStatus(401);
        }

        return res.json({ user: user.toAuthJSON() });
      })
      .catch(next);
  })

  .put(auth.required, (req, res, next) => {
    User.findById(req.payload.id)
      .then(user => {
        if (!user) {
          return res.sendStatus(401);
        }

        const {
          username,
          email,
          bio,
          image,
          password
        } = req.body.user;

        // Only update changed fields
        if (typeof username !== 'undefined') {
          user.username = username;
        }

        if (typeof email !== 'undefined') {
          user.email = email;
        }

        if (typeof bio !== 'undefined') {
          user.bio = bio;
        }

        if (typeof image !== 'undefined') {
          user.image = image;
        }

        if (typeof password !== 'undefined') {
          user.setPassword(password);
        }

        return user.save()
          .then(() => {
            return res.json({ user: user.toAuthJSON() });
          });
      })
      .catch(next);
  });

module.exports = router;
