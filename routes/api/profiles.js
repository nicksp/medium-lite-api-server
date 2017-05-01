const mongoose = require('mongoose');
const router = require('express').Router();

const User = mongoose.model('User');
const auth = require('../auth');

// Find the user whose username is specified in the URL
router.param('username', (req, res, next, username) => {
  User.findOne({ username })
    .then(user => {
      if (!user) {
        return res.sendStatus(404);
      }

      req.profile = user;
      return next();
    })
    .catch(next);
});

router.get('/:username', auth.optional, (req, res) => {
  if (req.payload) {
    User.findById(req.payload.id)
      .then(user => {
        if (!user) {
          return res.json({ profile: req.profile.getPublicProfile(false) });
        }

        return res.json({ profile: req.profile.getPublicProfile(user) });
      });
  } else {
    return res.json({ profile: req.profile.getPublicProfile(false) });
  }
});

router.post('/:username/follow', auth.required, (req, res, next) => {
  const profileId = req.profile._id;

  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.follow(profileId)
        .then(() => {
          return res.json({ profile: req.profile.getPublicProfile(user) });
        });
    })
    .catch(next);
});

router.delete('/:username/follow', auth.required, (req, res, next) => {
  const profileId = req.profile._id;

  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.unfollow(profileId)
        .then(() => {
          return res.json({ profile: req.profile.getPublicProfile(user) });
        });
    })
    .catch(next);
});

module.exports = router;
