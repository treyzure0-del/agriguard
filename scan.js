const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { callVisionAI } = require('../ai_service');
const { saveReport } = require('../database');

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

const SCAN_PROMPT = `You are an expert plant pathologist specializing in East African crops.
Analyze this crop leaf image carefully.
Return ONLY a valid JSON object with absolutely no extra text, no markdown, no code blocks.
The JSON must have exactly these fields:
{
  "crop_type": "name of the crop",
  "disease_name": "name of disease or Healthy",
  "confidence": 87,
  "health_score": 65,
  "severity": "medium",
  "explanation": "2-3 sentence explanation of what you see",
  "treatment": "specific actionable treatment steps",
  "prevention_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "issues": ["issue 1", "issue 2"]
}`;

const SIMPLE_PROMPT = `Analyze this plant image. Return ONLY valid JSON:
{"crop_type":"crop name","disease_name":"disease or Healthy","confidence":80,"health_score":70,"severity":"low","explanation":"brief description","treatment":"treatment advice","prevention_tips":["tip1","tip2"],"issues":["issue1"]}`;

function cleanJSON(text) {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Try to extract JSON object if surrounded by text
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }
  return cleaned;
}

function deleteTempFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (e) {
    console.error('[scan] Failed to delete temp file:', e.message);
  }
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

    // First attempt
    let rawResponse;
    try {
      rawResponse = await callVisionAI(base64Image, mimeType, SCAN_PROMPT);
    } catch (aiErr) {
      deleteTempFile(filePath);
      return res.status(500).json(getFallbackResult('AI service unavailable: ' + aiErr.message));
    }

    let result;
    try {
      const cleaned = cleanJSON(rawResponse);
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[scan] First parse failed, retrying with simple prompt...');
      try {
        const retryResponse = await callVisionAI(base64Image, mimeType, SIMPLE_PROMPT);
        const cleanedRetry = cleanJSON(retryResponse);
        result = JSON.parse(cleanedRetry);
      } catch (retryErr) {
        console.error('[scan] Both parse attempts failed');
        deleteTempFile(filePath);
        return res.json(getFallbackResult('Could not parse AI response'));
      }
    }

    // Validate and normalize result
    result = normalizeResult(result);

    // Save to database
    try {
      const id = saveReport(result);
      result.id = id;
    } catch (dbErr) {
      console.error('[scan] DB save failed:', dbErr.message);
    }

    deleteTempFile(filePath);
    res.json(result);

  } catch (err) {
    console.error('[scan] Unexpected error:', err.message);
    deleteTempFile(filePath);
    res.status(500).json(getFallbackResult(err.message));
  }
});

function normalizeResult(r) {
  return {
    crop_type: r.crop_type || 'Unknown Crop',
    disease_name: r.disease_name || 'Unknown',
    confidence: Math.min(100, Math.max(0, parseInt(r.confidence) || 75)),
    health_score: Math.min(100, Math.max(0, parseInt(r.health_score) || 50)),
    severity: ['low', 'medium', 'high'].includes(r.severity) ? r.severity : 'medium',
    explanation: r.explanation || 'No explanation provided.',
    treatment: r.treatment || 'Consult a local agricultural officer.',
    prevention_tips: Array.isArray(r.prevention_tips) ? r.prevention_tips : [],
    issues: Array.isArray(r.issues) ? r.issues : []
  };
}

function getFallbackResult(reason) {
  return {
    crop_type: 'Unknown',
    disease_name: 'Analysis Failed',
    confidence: 0,
    health_score: 50,
    severity: 'medium',
    explanation: 'Unable to analyze image at this time. ' + (reason || ''),
    treatment: 'Please try again or consult a local agricultural officer.',
    prevention_tips: ['Ensure good image quality', 'Use natural lighting', 'Focus on affected leaves'],
    issues: ['Analysis unavailable']
  };
}

module.exports = router;
