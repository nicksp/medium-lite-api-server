const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();

const User = mongoose.model('User');
const Article = mongoose.model('Article');
const Comment = mongoose.model('Comment');

const auth = require('../auth');

// Preload article objects on routes with ':article'
router.param('article', (req, res, next, slug) => {
  Article.findOne({ slug })
    .populate('author')
    .then(article => {
      if (!article) {
        return res.sendStatus(404);
      }

      req.article = article;

      return next();
    })
    .catch(next);
});

// Preload comment objects on routes with ':comment'
router.param('comment', (req, res, next, id) => {
  Comment.findById(id)
    .then(comment => {
      if (!comment) {
        return res.sendStatus(404);
      }

      req.comment = comment;

      return next();
    })
    .catch(next);
});

// List all articles
router.get('/', auth.optional, (req, res, next) => {
  const query = {};
  const limit = 20;
  const offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  if (typeof req.query.tag !== 'undefined') {
    query.tagList = { $in: [req.query.tag] };
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
  ]).then(results => {
    const [ author, favoriter ] = results;

    if (author) {
      query.author = author._id;
    }

    if (favoriter) {
      query._id = { $in: favoriter.favorites };
    } else if (req.query.favorited) {
      query._id = { $in: [] };
    }

    return Promise.all([
      Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createdAt: 'desc' })
        .populate('author')
        .exec(),
      Article.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ])
    .then(results => {
      const [ articles, articlesCount, user ] = results;

      return res.json({
        articles: articles.map(article => article.toPublicJSON(user)),
        count: articlesCount
      });
    });
  })
  .catch(next);
});

// Create new article
router.post('/', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      const article = new Article(req.body.article);

      article.author = user;

      return article.save()
        .then(() => res.json({ article: article.toPublicJSON(user) }));
    })
    .catch(next);
});

// Return a given article
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

// Update an article
router.put('/:article', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      // If we're the author of the updating article
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
          .then(article => res.json({ article: article.toPublicJSON(user) }))
          .catch(next);
      } else {
        return res.sendStatus(403);
      }
    });
});

// Remove article
router.delete('/:article', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(() => {
      // If we're the author of the article we're about to remove
      if (req.article.author._id.toString() === req.payload.id.toString()) {
        return req.article.remove()
          .then(() => res.sendStatus(204));
      } else {
        return res.sendStatus(403);
      }
    });
});

// Favorite an article
router.post('/:article/favorite', auth.required, (req, res, next) => {
  const articleId = req.article._id;

  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.favoriteArticle(articleId)
        .then(() => {
          return req.article.setFavoritesCount()
            .then(article => {
              return res.json({ article: article.toPublicJSON(user) });
            });
        });
    })
    .catch(next);
});

// Unfavorite an article
router.delete('/:article/favorite', auth.required, (req, res, next) => {
  const articleId = req.article._id;

  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.unfavoriteArticle(articleId)
        .then(() => {
          return req.article.setFavoritesCount()
            .then(article => {
              return res.json({ article: article.toPublicJSON(user) });
            });
        });
    })
    .catch(next);
});

// Create a new comment
router.post('/:article/comments', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      const comment = new Comment(req.body.comment);

      comment.author = user;
      comment.article = req.article;

      return comment.save()
        .then(() => {
          req.article.comments.push(comment);

          return req.article.save()
            .then(() => res.json({ comment: comment.toPublicJSON(user) }));
        });
    })
    .catch(next);
});

// List comments on articles
router.get('/:article/comments', auth.optional, (req, res, next) => {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
    .then(user => {
      return req.article.populate({
        path: 'comments',
        populate: {
          path: 'author'
        },
        options: {
          sort: {
            createdAt: 'desc'
          }
        }
      }).execPopulate().then(article => {
        return res.json({ comments: req.article.comments.map(comment => comment.toPublicJSON(user)) });
      });
    })
    .catch(next);
});

// Remove existing comment
router.delete(':article/comments/:comment', auth.required, (req, res, next) => {
  if (req.comment.author.toString() === req.payload.id.toString()) {
    req.article.comments.remove(req.comment._id);
    req.article.save()
      .then(Comment.find({ _id: req.comment._id }).remove().exec())
      .then(() => res.sendStatus(204));
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
