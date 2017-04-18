const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');

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
    favoritesCount: this.favoritesCount,
    author: this.author.getPublicProfile(user)
  };
};

ArticleSchema.pre('validate', (next) => {
  this.slugify();
  next();
});

mongoose.model('Article', ArticleSchema);
