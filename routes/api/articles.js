const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();

const User = mongoose.model('User');
const Article = mongoose.model('Article');
const auth = require('../auth');

router.param('article', (req, res, next, slug) => {
  Article.findOne({ slug })
    .populate('author')
    .then(article => {
      if (!article) {
        res.sendStatus(404);
      }

      req.article = article;
      return next();
    })
    .catch(next);
});

router.post('/', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      const article = new Article(req.body.article);

      article.author = user;

      return article.save()
        .then(() => {
          console.log(article.author);
          return res.json({ article: article.toPublicJSON(user) });
        });
    })
    .catch(next);
});

router.get('/:article', auth.optional, (req, res, next) => {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.article.populate('author').execPopulate()
  ])
  .then(results => {
    const user = results[0];
    return res.json({ article: req.article.toPublicJSON(user) });
  })
  .catch(next);
});

router.put('/:article', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      // if we're the author of the updating article
      if (req.article.author._id.toString() === req.payload.id.toString()) {
        const { title, body, description } = req.body.article;

        if (typeof title !== 'undefined') {
          req.article.title = title;
        }

        if (typeof description !== 'undefined') {
          req.article.description = description;
        }

        if (typeof body !== 'undefined') {
          req.article.body = body;
        }

        req.article.save()
          .then(article => {
            return res.json({ article: article.toPublicJSON(user) });
          })
          .catch(next);
      } else {
        return res.sendStatus(403);
      }
    });
});

router.delete('/:article', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(() => {
      // if we're the author of the article we're about to remove
      if (req.article.author._id.toString() === req.payload.id.toString()) {
        return req.article.remove()
          .then(() => {
            return res.sendStatus(204);
          });
      } else {
        return res.sendStatus(403);
      }
    });
});

module.exports = router;
