const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 500,
  },
  streak: {
    type: Number,
    default: 0,
  },
  badges: {
    type: [String],
    default: [],
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
