const mongoose = require('mongoose');

const Post = new mongoose.Schema({
  text: { type: String },
  userId: { type: String },
  playlistId: { type: String },
  date: { type: Date, default: Date.now },
  likes: [{ userId: Number }],
});

module.exports = mongoose.model('post', Post);
