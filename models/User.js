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

mongoose.model('User', UserSchema);
