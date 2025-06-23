const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../../data/items.json');

/**
 * Load the array of items from disk.
 * @returns {Promise<Array>}
 */
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Persist the array of items to disk.
 * @param {Array} data
 */
async function writeData(data) {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(DATA_PATH, json, 'utf-8');
}

/**
 * Validate the incoming item payload.
 * Returns an array of error messages; empty if valid.
 * @param {Object} item
 * @returns {string[]}
 */
function validateItemPayload(item) {
  const errors = [];
  if (typeof item !== 'object' || item === null) {
    errors.push('Payload must be a JSON object');
    return errors;
  }
  if (!item.name || typeof item.name !== 'string') {
    errors.push('`name` is required and must be a non-empty string');
  }
  if (!item.category || typeof item.category !== 'string') {
    errors.push('`category` is required and must be a non-empty string');
  }
  if (item.price == null || typeof item.price !== 'number' || isNaN(item.price)) {
    errors.push('`price` is required and must be a number');
  } else if (item.price < 0) {
    errors.push('`price` cannot be negative');
  }
  return errors;
}

// GET /api/items
// Supports optional `q` (substring search, case-insensitive),
// and pagination via `page` and `limit`.
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    let results = Array.isArray(data) ? data : [];

    // Search
    if (req.query.q) {
      const term = req.query.q.toLowerCase();
      results = results.filter(i =>
        typeof i.name === 'string' && i.name.toLowerCase().includes(term)
      );
    }

    if (req.query.category) {
      const cat = req.query.category;
      results = results.filter(i =>
        typeof i.category === 'string' && i.category === cat
      );
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 50, 1);
    const start = (page - 1) * limit;
    const pageItems = results.slice(start, start + limit);

    res.json({ items: pageItems, total: results.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
// Returns the item with the given `id` or 404 if not found.
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const id = parseInt(req.params.id, 10);
    const item = (Array.isArray(data) ? data : []).find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
// Validates payload; on success appends to file and returns 201 + new item.
// On validation error returns 400 + { errors: [...] }.
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body;
    const errors = validateItemPayload(payload);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const data = await readData();
    const newItem = {
      id: Date.now(),
      name: payload.name.trim(),
      category: payload.category.trim(),
      price: payload.price
    };

    data.push(newItem);
    await writeData(data);

    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
