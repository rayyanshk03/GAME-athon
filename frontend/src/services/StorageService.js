/**
 * StorageService.js
 * Robust localStorage abstraction with versioning and validation.
 * SWAP GUIDE: Replace set/get implementations with fetch() to an Express API
 * to go full-stack without changing any component code.
 */

const PREFIX = 'sq_';
const VERSION = '1.0';

const StorageService = {
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, ts: Date.now(), data: value }));
      return true;
    } catch (err) {
      console.error(`[Storage] set(${key}):`, err);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return defaultValue;
      const payload = JSON.parse(raw);
      if (!payload || payload.v !== VERSION) { this.remove(key); return defaultValue; }
      return payload.data ?? defaultValue;
    } catch (err) {
      console.error(`[Storage] get(${key}):`, err);
      return defaultValue;
    }
  },

  remove(key) {
    try { localStorage.removeItem(PREFIX + key); return true; } catch { return false; }
  },

  clear() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
      return true;
    } catch { return false; }
  },

  getTimestamp(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key))?.ts || null; } catch { return null; }
  },

  // ── Future backend swap stubs ────────────────────────────────────────────
  async setRemote(key, value) {
    // FUTURE: await fetch(`/api/store/${key}`, { method: 'POST', body: JSON.stringify({ value }) });
    return this.set(key, value);
  },
  async getRemote(key, defaultValue = null) {
    // FUTURE: const res = await fetch(`/api/store/${key}`); return res.ok ? (await res.json()).value : defaultValue;
    return this.get(key, defaultValue);
  },
};

export default StorageService;
