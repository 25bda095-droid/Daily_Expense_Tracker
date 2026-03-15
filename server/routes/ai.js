const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../database/queries');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/insights', async (req, res) => {
  try {
    const expenses = db.getAll();
    const summary  = db.getSummary();

    const prompt = `
      Here are a user's recent expenses: ${JSON.stringify(summary)}.
      Full list: ${JSON.stringify(expenses.slice(0, 20))}.
      Give exactly 3 short financial insights (1 sentence each).
      Return ONLY a JSON array of 3 strings. No extra text.
    `;

    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim()
                     .replace(/```json|```/g, '');
    const parsed = JSON.parse(text);

    res.json({ insights: parsed });
  } catch (err) {
    res.status(500).json({ insights: ['Could not load insights.', '', ''] });
  }
});

module.exports = router;
