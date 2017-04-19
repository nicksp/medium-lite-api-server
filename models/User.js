const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const appSecret = require('../config').secret;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'can\'t be blank'],
    match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'can\'t be blank'],
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  bio: String,
  image: String,
  hash: String,
  salt: String
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' });

/**
 * Set user password.
 */
UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
};

/**
 * Validate user password.
 */
UserSchema.methods.isValidPassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
  return hash === this.hash;
};

/**
 * Generate a JWT (JSON Web Token).
 */
UserSchema.methods.generateJwt = function () {
  const today = new Date();
  const expiresAt = new Date(today);

  // Expires in 60 days in the future
  expiresAt.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    expiresAt: parseInt(expiresAt.getTime() / 1000)
  }, appSecret);
};

/**
 * Get the JSON representation of a user for authentication.
 */
UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJwt()
  };
};

/**
 * Return public profile data
 */
UserSchema.methods.getPublicProfile = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'http://static.domainname.com/images/anon.png',
    following: false
  }
};

/**
 * Favorite an article.
 */
UserSchema.methods.favoriteArticle = function (id) {
  if (this.favorites.indexOf(id) === -1) {
    this.favorites.push(id);
  }

  return this.save();
};

/**
 * Unfavorite an article.
 */
UserSchema.methods.unfavoriteArticle = function (id) {
  this.favorites.remove(id);
  return this.save();
};

/**
 * Check wheather or not we've favorited an article.
 */
UserSchema.methods.isFavorite = function (id) {
  return this.favorites.some(favId => favId.toString() === id.toString());
};

mongoose.model('User', UserSchema);
