const db = require('./db');

const getAll = () =>
  db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();

const add = ({ amount, category, description, date }) =>
  db.prepare(
    'INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)'
  ).run(amount, category, description, date);

const remove = (id) =>
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

const getSummary = () =>
  db.prepare(
    'SELECT category, SUM(amount) as total FROM expenses GROUP BY category'
  ).all();

module.exports = { getAll, add, remove, getSummary };