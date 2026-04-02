/**
 * routes/storage.js
 * REST API equivalent of StorageService.js
 * Frontend can swap localStorage calls to these endpoints.
 * Future: replace in-memory store with a real DB (MongoDB / PostgreSQL).
 */
const router = require('express').Router();

// In-memory store (swap with DB later)
const store = {};

// GET /api/store/:key
router.get('/:key', (req, res) => {
  const value = store[req.params.key];
  if (value === undefined) return res.json({ found: false, value: null });
  res.json({ found: true, value });
});

// POST /api/store/:key  { value: any }
router.post('/:key', (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value is required' });
  store[req.params.key] = value;
  res.json({ success: true, key: req.params.key });
});

// DELETE /api/store/:key
router.delete('/:key', (req, res) => {
  delete store[req.params.key];
  res.json({ success: true });
});

module.exports = router;
