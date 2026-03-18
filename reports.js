const express = require('express');
const { saveReport, getAllReports, checkOutbreak } = require('../database');

const router = express.Router();

// GET /api/reports — fetch all disease reports
router.get('/reports', (req, res) => {
  try {
    const reports = getAllReports();
    res.json(reports);
  } catch (err) {
    console.error('[reports] GET /reports error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
});

// POST /api/report — save a new disease report
router.post('/report', (req, res) => {
  const data = req.body;
  if (!data || !data.disease_name) {
    return res.status(400).json({ error: 'disease_name is required' });
  }
  try {
    const id = saveReport(data);
    res.json({ success: true, id });
  } catch (err) {
    console.error('[reports] POST /report error:', err.message);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// GET /api/outbreak-check?lat=&lng=&disease=&radius=
router.get('/outbreak-check', (req, res) => {
  const { lat, lng, disease, radius } = req.query;
  if (!lat || !lng || !disease) {
    return res.status(400).json({ error: 'lat, lng, and disease are required' });
  }
  try {
    const result = checkOutbreak(
      parseFloat(lat),
      parseFloat(lng),
      disease,
      radius ? parseFloat(radius) : 50
    );
    res.json(result);
  } catch (err) {
    console.error('[reports] outbreak-check error:', err.message);
    res.status(500).json({ error: 'Failed to check outbreak' });
  }
});

module.exports = router;
