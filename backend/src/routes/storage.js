/**
 * routes/storage.js
 * MongoDB-backed key-value store.
 * Falls back gracefully to in-memory when MongoDB is not connected.
 */
const router  = require('express').Router();
const { isConnected } = require('../db');
const { KVStore } = require('../models');

// In-memory fallback (used when MongoDB is unavailable)
const memStore = {};

// ─── GET /api/store/:key ──────────────────────────────────────────────────
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    if (isConnected()) {
      const doc = await KVStore.findOne({ key });
      return res.json({ found: !!doc, value: doc ? doc.value : null });
    }
  } catch (err) {
    console.warn('[storage GET] DB error, using memory fallback:', err.message);
  }
  const value = memStore[key];
  res.json({ found: value !== undefined, value: value ?? null });
});

// ─── POST /api/store/:key  { value: any } ────────────────────────────────
router.post('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value is required' });

  try {
    if (isConnected()) {
      await KVStore.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.json({ success: true, key, persisted: true });
    }
  } catch (err) {
    console.warn('[storage POST] DB error, using memory fallback:', err.message);
  }
  memStore[key] = value;
  res.json({ success: true, key, persisted: false });
});

// ─── DELETE /api/store/:key ───────────────────────────────────────────────
router.delete('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    if (isConnected()) {
      await KVStore.deleteOne({ key });
      return res.json({ success: true, persisted: true });
    }
  } catch (err) {
    console.warn('[storage DELETE] DB error, using memory fallback:', err.message);
  }
  delete memStore[key];
  res.json({ success: true, persisted: false });
});

module.exports = router;
