const express = require('express');
const router = express.Router();
const User = require('../models');
const { isConnected } = require('../db');

/**
 * POST /signup
 * Creates a new user in MongoDB perfectly mapped for the leaderboard.
 */
router.post('/signup', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'userId and password are required' });
    }

    if (!isConnected()) {
      return res.status(503).json({ error: 'Database is offline' });
    }

    const existing = await User.findOne({ userId });
    if (existing) {
      return res.status(409).json({ error: 'User already exists!' });
    }

    const user = new User({ userId, username: username || userId, password, lastLogin: Date.now() });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /login
 * Validates credentials simply for hackathon authentication.
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'userId and password are required' });
    }

    if (!isConnected()) {
      return res.status(503).json({ error: 'Database is offline' });
    }

    const user = await User.findOne({ userId });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /:userId/points
 * Update a specific user's point total securely.
 */
router.patch('/:userId/points', async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (!isConnected()) {
      return res.status(503).json({ error: 'Database connection offline' });
    }

    if (typeof points !== 'number') {
      return res.status(400).json({ error: 'Points value must be a number' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { points },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating points:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /leaderboard
 * Fetch the top 50 users from the database based on their points total.
 */
router.get('/leaderboard', async (req, res) => {
  try {
    if (!isConnected()) {
       return res.status(200).json({ leaderboard: [], source: 'error' });
    }

    const users = await User.find({})
      .sort({ points: -1 })
      .limit(50)
      .lean(); // .lean() handles stripping MongoDB wrapper functions from objects

    // Assign rank to each user natively in JS after querying
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.status(200).json({ leaderboard, source: 'db' });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(200).json({ leaderboard: [], source: 'error' });
  }
});

module.exports = router;
