const express = require('express');
const rateLimit = require('express-rate-limit');
const { callAdvisorAI } = require('../ai_service');
const { saveChatMessage } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const advisorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests. Please wait a moment.' }
});

// AI Advisor now REQUIRES login
router.post('/', advisorLimiter, requireAuth, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array is required' });

  try {
    const response = await callAdvisorAI(messages);

    // Save both sides of conversation to chat history
    try {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      if (lastUser) {
        saveChatMessage(req.user.id, 'user', lastUser.content);
        saveChatMessage(req.user.id, 'assistant', response);
      }
    } catch (dbErr) {
      console.error('[advisor] chat save failed:', dbErr.message);
    }

    res.json({ response });
  } catch (err) {
    console.error('[advisor] AI failed:', err.message);
    res.json({
      response: "I'm having trouble connecting right now. Please check your API key in the .env file and try again."
    });
  }
});

module.exports = router;
