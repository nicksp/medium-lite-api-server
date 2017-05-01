const mongoose = require('mongoose');
const router = require('express').Router();

const Article = mongoose.model('Article');

// Get the set of tags that have been used on articles
router.get('/', (req, res, next) => {
  Article.find().distinct('tagList')
    .then(tags => {
      return res.json({ tags });
    })
    .catch(next);
});

module.exports = router;
