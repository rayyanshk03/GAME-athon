/**
 * db.js — MongoDB connection via Mongoose
 * Connects once and reuses the connection throughout the app lifetime.
 */
const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
  if (connected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️  MONGODB_URI not set — running WITHOUT database (data will not persist).');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log('🍃 MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('   App will continue without persistence.');
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
