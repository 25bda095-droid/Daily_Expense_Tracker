const router = require('express').Router();
const db     = require('../database/queries');

// GET /expenses — all expenses
router.get('/', (req, res) => {
  try {
    res.json(db.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /expenses — add new expense
// Body: { amount, category, description, date }
router.post('/', (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'amount, category, and date are required' });
    }
    const result = db.add({ amount, category, description, date });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /expenses/:id — delete by id
router.delete('/:id', (req, res) => {
  try {
    const result = db.remove(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /expenses/summary — totals grouped by category
router.get('/summary', (req, res) => {
  try {
    res.json(db.getSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;