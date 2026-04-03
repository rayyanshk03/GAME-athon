const mongoose = require('mongoose');

// State to track whether the connection is active
const dbState = {
  isConnected: false,
};

/**
 * Ensures a robust MongoDB connection and updates the tracking state 
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠️ MONGO_URI is missing from process.env — skipping database connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    dbState.isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Optional: could exit process here if DB is strictly required
    // process.exit(1);
  }
};

module.exports = {
  connectDB,
  isConnected: () => dbState.isConnected, // Function so the caller gets latest status
};
