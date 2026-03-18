const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { callPestVisionAI } = require('../ai_service');
const { savePestReport } = require('../database');

const router = express.Router();

const upload = multer({
  dest: './uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function cleanJSON(text) {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  return cleaned;
}

function deleteTempFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (e) {
    console.error('[pest] Failed to delete temp file:', e.message);
  }
}

function getFallbackPestResult(reason) {
  return {
    pest_name: 'Analysis Failed',
    threat_level: 'MEDIUM',
    affected_crops: 'Unknown',
    description: 'Unable to analyze image at this time. ' + (reason || ''),
    symptoms: ['Analysis unavailable'],
    treatment: 'Please try again with a clearer image or consult a local agricultural officer.',
    prevention: ['Use good agricultural practices', 'Scout fields regularly', 'Maintain crop hygiene'],
    economic_impact: 'Could not determine economic impact.'
  };
}

function normalizePestResult(r) {
  const validLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  return {
    pest_name: r.pest_name || 'Unknown Pest',
    threat_level: validLevels.includes((r.threat_level || '').toUpperCase())
      ? r.threat_level.toUpperCase()
      : 'MEDIUM',
    affected_crops: r.affected_crops || 'Various crops',
    description: r.description || 'No description available.',
    symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
    treatment: r.treatment || 'Consult a local agricultural officer.',
    prevention: Array.isArray(r.prevention) ? r.prevention : [],
    economic_impact: r.economic_impact || 'Economic impact not determined.'
  };
}

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    let rawResponse;
    try {
      rawResponse = await callPestVisionAI(base64Image, mimeType);
    } catch (aiErr) {
      deleteTempFile(filePath);
      return res.status(500).json(getFallbackPestResult('AI service unavailable: ' + aiErr.message));
    }

    let result;
    try {
      const cleaned = cleanJSON(rawResponse);
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[pest] JSON parse failed:', parseErr.message);
      deleteTempFile(filePath);
      return res.json(getFallbackPestResult('Could not parse AI response'));
    }

    result = normalizePestResult(result);

    // Save pest report to database
    try {
      const id = savePestReport(result);
      result.id = id;
    } catch (dbErr) {
      console.error('[pest] DB save failed:', dbErr.message);
    }

    deleteTempFile(filePath);
    res.json(result);

  } catch (err) {
    console.error('[pest] Unexpected error:', err.message);
    deleteTempFile(filePath);
    res.status(500).json(getFallbackPestResult(err.message));
  }
});

module.exports = router;
