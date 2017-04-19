const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');

const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema({
  slug: {
    type: String,
    lowercase: true,
    unique: true
  },
  title: String,
  description: String,
  body: String,
  favoritesCount: {
    type: Number,
    default: 0
  },
  tagList: [{ type: String }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken.' });

ArticleSchema.pre('validate', function(next){
  this.slugify();
  next();
});

/**
 * Generate unique article slugs.
 */
ArticleSchema.methods.slugify = function () {
  this.slug = `${slug(this.title)}_${(Math.random() * Math.pow(36, 6) | 0).toString(36)}`;
};

/**
 * Return the JSON output of an article.
 */
ArticleSchema.methods.toPublicJSON = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.getPublicProfile(user)
  };
};

/**
 * Update an article's favorites count.
 */
ArticleSchema.methods.setFavoritesCount = function () {
  const article = this;
  return User.count({ favorites: { $in: [article._id] }})
    .then(count => {
      article.favoritesCount = count;
      return article.save();
    });
};

mongoose.model('Article', ArticleSchema);
