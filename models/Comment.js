const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  body: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, { timestamps: true });

/**
 * Require population of author.
 */
CommentSchema.methods.toPublicJSON = function (user) {
  return {
    id: this._id,
    body: this.body,
    createdAt: this.createdAt,
    author: this.author.getPublicProfile(user)
  };
};

mongoose.model('Comment', CommentSchema);
