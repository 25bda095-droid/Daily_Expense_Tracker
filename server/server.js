const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const expensesRouter = require('./routes/expenses');
const aiRouter       = require('./routes/ai');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/expenses', expensesRouter);
app.use('/ai',       aiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));