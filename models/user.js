const mongoose = require('mongoose');

const User = new mongoose.Schema({
  displayName: { type: String, required: true },
  userName: { type: String, required: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
  accessToken: { type: String },
  refreshToken: { type: String },
  spotifyId: { type: String },
  posts: [{ postId: Number }],
  followers: [{ followerId: Number }],
  followings: [{ followingId: Number }],
  search: [{ query: String }],
  email: String,
  phone: String,
});

module.exports = mongoose.model('user', User);
