require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// Initialize database (runs migrations + seeds)
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const PROVIDER = process.env.AI_PROVIDER || 'gemini';

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for CDN resources in frontend
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC FILES ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '../frontend')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

const advisorRouter = require('./routes/advisor');
const scanRouter = require('./routes/scan');
const pestRouter = require('./routes/pest');
const reportsRouter = require('./routes/reports');

app.use('/api/advisor', advisorRouter);
app.use('/api/scan', scanRouter);
app.use('/api/pest', pestRouter);
app.use('/api', reportsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: PROVIDER,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        AgriGuard AI is running!          ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  URL:      http://localhost:${PORT}          ║`);
  console.log(`║  Provider: ${PROVIDER.padEnd(30)} ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  Press Ctrl+C to stop                    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Warn if no API key configured
  const keyMap = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY
  };
  const activeKey = keyMap[PROVIDER];
  if (!activeKey || activeKey.startsWith('paste_your')) {
    console.warn(`⚠️  WARNING: ${PROVIDER.toUpperCase()} API key not configured in .env`);
    console.warn('   AI features will not work until you add your key.');
    console.warn('   Get a free Gemini key at: https://aistudio.google.com');
    console.warn('');
  } else {
    console.log(`✅ AI Provider: ${PROVIDER} (key configured)`);
  }
});
