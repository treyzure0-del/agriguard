const express = require('express');
const rateLimit = require('express-rate-limit');
const { callAdvisorAI } = require('../ai_service');

const router = express.Router();

const advisorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a moment before asking again.' }
});

router.post('/', advisorLimiter, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Validate message format
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ error: 'Each message must have role and content' });
    }
  }

  try {
    const response = await callAdvisorAI(messages);
    res.json({ response });
  } catch (err) {
    console.error('[advisor] AI call failed:', err.message);
    res.json({
      response: "I'm having trouble connecting right now. Please check your API key in the .env file and try again. Make sure your key is correct and has no extra spaces."
    });
  }
});

module.exports = router;
