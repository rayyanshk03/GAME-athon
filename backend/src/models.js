const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── KV Store ─────────────────────────────────────────────────────────────
// Generic key-value store replacing the backend in-memory `store` object.
const KVSchema = new Schema({
  key:       { type: String, required: true, unique: true, index: true },
  value:     { type: Schema.Types.Mixed },
  updatedAt: { type: Date,   default: Date.now },
}, { collection: 'kvstore' });
KVSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
const KVStore = mongoose.model('KVStore', KVSchema);

// ─── User ─────────────────────────────────────────────────────────────────
const UserSchema = new Schema({
  userId:    { type: String, required: true, unique: true, index: true },
  username:  { type: String, default: 'Player' },
  email:     { type: String, required: true, unique: true, index: true },
  password:  { type: String, required: true },
  points:    { type: Number, default: 500 },
  streak:    { type: Number, default: 0 },
  lastLogin: { type: Date,   default: Date.now },
  badges:    [String],
  createdAt: { type: Date,   default: Date.now },
}, { collection: 'users' });
const User = mongoose.model('User', UserSchema);

// ─── Trade ────────────────────────────────────────────────────────────────
const TradeSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  symbol:    { type: String, required: true },
  name:      { type: String },
  type:      { type: String, enum: ['buy', 'sell'], required: true },
  qty:       { type: Number, required: true },
  price:     { type: Number, required: true },
  total:     { type: Number, required: true },
  timestamp: { type: Date,   default: Date.now, index: true },
}, { collection: 'trades' });
const Trade = mongoose.model('Trade', TradeSchema);

// ─── Bet ──────────────────────────────────────────────────────────────────
const BetSchema = new Schema({
  userId:      { type: String, required: true, index: true },
  symbol:      { type: String, required: true },
  direction:   { type: String, enum: ['up', 'down'], required: true },
  stake:       { type: Number, required: true },
  multiplier:  { type: Number, default: 1 },
  duration:    { type: Number },                     // in minutes
  entryPrice:  { type: Number },
  exitPrice:   { type: Number },
  outcome:     { type: String, enum: ['win', 'loss', 'pending'], default: 'pending' },
  pnl:         { type: Number },
  resolvedAt:  { type: Date },
  createdAt:   { type: Date, default: Date.now, index: true },
}, { collection: 'bets' });
const Bet = mongoose.model('Bet', BetSchema);

module.exports = { KVStore, User, Trade, Bet };
