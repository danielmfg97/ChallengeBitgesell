const express = require('express');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const router = express.Router();

const readFile = promisify(fs.readFile);
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let cache = {
  stats: null,
  lastLoaded: 0
};

// Compute stats from file
async function computeStats() {
  const content = await readFile(DATA_PATH, 'utf-8');
  const items = JSON.parse(content);
  const count = items.length;
  const avgId = items.reduce((sum, i) => sum + (i.id || 0), 0) / (count || 1);
  return { count, avgId };
}

// Invalidate cache on file change
try {
  fs.watch(DATA_PATH, () => {
    cache.stats = null;
    cache.lastLoaded = 0;
  });
} catch (e) {
  // ignore if file not exist yet
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    if (!cache.stats) {
      cache.stats = await computeStats();
      cache.lastLoaded = Date.now();
    }
    return res.json({
      ...cache.stats,
      generatedAt: new Date(cache.lastLoaded).toISOString()
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

module.exports = router;
