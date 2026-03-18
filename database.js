const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './agriguard.db';
const db = new Database(path.resolve(dbPath));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS disease_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT NOT NULL,
    disease_name TEXT NOT NULL,
    confidence INTEGER DEFAULT 0,
    health_score INTEGER DEFAULT 50,
    severity TEXT DEFAULT 'medium',
    explanation TEXT,
    treatment TEXT,
    prevention_tips TEXT,
    issues TEXT,
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    farmer_name TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    is_demo INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT NOT NULL,
    health_score INTEGER NOT NULL,
    notes TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pest_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pest_name TEXT NOT NULL,
    threat_level TEXT DEFAULT 'MEDIUM',
    affected_crops TEXT,
    description TEXT,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    economic_impact TEXT,
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );
`);

// Seed demo data if table is empty
const existingCount = db.prepare('SELECT COUNT(*) as count FROM disease_reports').get();
if (existingCount.count === 0) {
  const insertDemo = db.prepare(`
    INSERT INTO disease_reports 
    (crop_type, disease_name, confidence, health_score, severity, explanation, treatment, prevention_tips, issues, latitude, longitude, location_name, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const demoReports = [
    {
      crop_type: 'Maize',
      disease_name: 'Maize Lethal Necrosis',
      confidence: 92,
      health_score: 22,
      severity: 'high',
      explanation: 'Maize Lethal Necrosis (MLN) detected. Plant shows chlorotic mottling and necrosis starting from leaf margins. This is a severe viral disease caused by co-infection of MCMV and SCMV.',
      treatment: 'Remove and destroy all infected plants immediately. Apply imidacloprid to control vector insects. Plant certified MLN-tolerant varieties in next season.',
      prevention_tips: JSON.stringify(['Use certified disease-free seed', 'Control aphid and thrip vectors', 'Practice crop rotation with non-grass crops', 'Rogue out infected plants early']),
      issues: JSON.stringify(['Severe viral infection', 'Vector insects present']),
      latitude: 0.3136,
      longitude: 32.5811,
      location_name: 'Kampala, Uganda'
    },
    {
      crop_type: 'Cassava',
      disease_name: 'Cassava Mosaic Disease',
      confidence: 88,
      health_score: 35,
      severity: 'high',
      explanation: 'Classic cassava mosaic virus symptoms observed. Leaves show yellow-green mosaic pattern and distortion. Spread by whitefly vectors and infected cuttings.',
      treatment: 'Remove infected plants. Apply neem-based pesticide to control whiteflies. Replace with CMD-resistant varieties like NASE 14.',
      prevention_tips: JSON.stringify(['Use virus-free clean planting material', 'Control whitefly populations', 'Plant resistant varieties', 'Inspect new planting material before use']),
      issues: JSON.stringify(['Whitefly infestation', 'Virus spread risk']),
      latitude: 0.3654,
      longitude: 32.4452,
      location_name: 'Wakiso, Uganda'
    },
    {
      crop_type: 'Tomato',
      disease_name: 'Early Blight',
      confidence: 85,
      health_score: 48,
      severity: 'medium',
      explanation: 'Alternaria solani infection causing early blight. Brown lesions with concentric rings observed on lower leaves. Disease spreads upward in humid conditions.',
      treatment: 'Apply copper-based fungicide (Kocide 3000) at 7-day intervals. Remove and destroy infected leaves. Apply mancozeb as protective spray.',
      prevention_tips: JSON.stringify(['Space plants for good air circulation', 'Mulch to prevent soil splash', 'Avoid overhead irrigation', 'Use certified disease-free transplants']),
      issues: JSON.stringify(['Fungal lesions spreading', 'High humidity risk']),
      latitude: 0.3556,
      longitude: 32.8897,
      location_name: 'Mukono, Uganda'
    },
    {
      crop_type: 'Bean',
      disease_name: 'Bean Rust',
      confidence: 91,
      health_score: 55,
      severity: 'medium',
      explanation: 'Uromyces appendiculatus causing bean rust. Small reddish-brown pustules visible on leaf undersides. Common in cool, humid highland conditions.',
      treatment: 'Apply triazole fungicide (Tilt 250EC) at first sign of rust. Repeat every 14 days. Remove heavily infected plant material.',
      prevention_tips: JSON.stringify(['Plant resistant bean varieties', 'Avoid dense planting', 'Apply preventive fungicide before rainy season', 'Rotate with non-legume crops']),
      issues: JSON.stringify(['Rust pustules on leaves', 'Yield reduction risk']),
      latitude: 2.7748,
      longitude: 32.2988,
      location_name: 'Gulu, Uganda'
    },
    {
      crop_type: 'Banana',
      disease_name: 'Black Sigatoka',
      confidence: 87,
      health_score: 40,
      severity: 'high',
      explanation: 'Mycosphaerella fijiensis detected causing Black Sigatoka. Dark streaks and lesions destroying leaf tissue, severely reducing photosynthesis. Major banana yield loss disease.',
      treatment: 'Apply systemic fungicide (propiconazole or trifloxystrobin). Remove dead leaves. Improve drainage around plants.',
      prevention_tips: JSON.stringify(['Regular removal of old leaves', 'Ensure proper plant spacing', 'Apply preventive fungicide during rains', 'Use improved resistant clones']),
      issues: JSON.stringify(['Severe leaf destruction', 'Reduced photosynthesis']),
      latitude: -0.6077,
      longitude: 30.6519,
      location_name: 'Mbarara, Uganda'
    },
    {
      crop_type: 'Coffee',
      disease_name: 'Coffee Leaf Rust',
      confidence: 93,
      health_score: 30,
      severity: 'high',
      explanation: 'Hemileia vastatrix - coffee leaf rust. Orange powdery spore masses on leaf undersides. One of the most destructive coffee diseases causing up to 50% yield loss.',
      treatment: 'Apply copper-based fungicide immediately. Follow with systemic fungicide (tebuconazole). Prune to improve air circulation.',
      prevention_tips: JSON.stringify(['Apply preventive copper spray before rainy season', 'Plant rust-resistant varieties', 'Maintain proper shade cover', 'Remove infected leaves promptly']),
      issues: JSON.stringify(['Heavy rust spore load', 'Defoliation occurring']),
      latitude: 0.6692,
      longitude: 30.2542,
      location_name: 'Fort Portal, Uganda'
    },
    {
      crop_type: 'Maize',
      disease_name: 'Gray Leaf Spot',
      confidence: 79,
      health_score: 58,
      severity: 'medium',
      explanation: 'Cercospora zeae-maydis causing gray leaf spot. Rectangular gray-tan lesions running parallel to leaf veins. More severe in humid, warm conditions.',
      treatment: 'Apply azoxystrobin or pyraclostrobin fungicide. Ensure good air circulation. Remove crop debris after harvest.',
      prevention_tips: JSON.stringify(['Use resistant hybrids', 'Practice minimum tillage to reduce residue', 'Rotate with non-maize crops', 'Apply fungicide at early tasseling']),
      issues: JSON.stringify(['Fungal lesions on leaves', 'Humid conditions favoring spread']),
      latitude: 0.4442,
      longitude: 34.1819,
      location_name: 'Tororo, Uganda'
    },
    {
      crop_type: 'Potato',
      disease_name: 'Late Blight',
      confidence: 96,
      health_score: 18,
      severity: 'high',
      explanation: 'Phytophthora infestans - late blight. Dark water-soaked lesions with white mold on underside. Extremely destructive, can destroy entire crop within days in cool wet conditions.',
      treatment: 'Apply metalaxyl + mancozeb (Ridomil Gold MZ) immediately. Repeat every 5-7 days in wet weather. Destroy infected tubers.',
      prevention_tips: JSON.stringify(['Use certified disease-free seed tubers', 'Apply preventive fungicide before rains', 'Improve drainage in field', 'Harvest promptly after vine death']),
      issues: JSON.stringify(['Critical infection level', 'Tuber rot risk high']),
      latitude: 0.6515,
      longitude: 29.9064,
      location_name: 'Kasese, Uganda'
    },
    {
      crop_type: 'Maize',
      disease_name: 'Healthy Crop',
      confidence: 94,
      health_score: 92,
      severity: 'low',
      explanation: 'Maize plants appear healthy with good green color and no visible disease symptoms. Plants are at V8 growth stage with good stand.',
      treatment: 'No treatment needed. Continue good agronomic practices.',
      prevention_tips: JSON.stringify(['Apply top-dress nitrogen fertilizer', 'Scout regularly for pests', 'Maintain weed-free conditions', 'Ensure adequate soil moisture']),
      issues: JSON.stringify([]),
      latitude: -1.2921,
      longitude: 36.8219,
      location_name: 'Nairobi, Kenya'
    },
    {
      crop_type: 'Sorghum',
      disease_name: 'Sorghum Anthracnose',
      confidence: 82,
      health_score: 44,
      severity: 'medium',
      explanation: 'Colletotrichum sublineolum causing sorghum anthracnose. Red to tan lesions with darker borders on leaves and stalk. Common in humid tropical regions.',
      treatment: 'Apply carbendazim fungicide. Remove infected plant tissue. Avoid water stress which increases susceptibility.',
      prevention_tips: JSON.stringify(['Use resistant sorghum varieties', 'Avoid dense planting', 'Remove and destroy crop residues', 'Practice 2-year rotation with non-grass crops']),
      issues: JSON.stringify(['Anthracnose lesions', 'Grain mold risk']),
      latitude: -2.5167,
      longitude: 32.9000,
      location_name: 'Mwanza, Tanzania'
    },
    {
      crop_type: 'Tomato',
      disease_name: 'Bacterial Wilt',
      confidence: 89,
      health_score: 25,
      severity: 'high',
      explanation: 'Ralstonia solanacearum causing bacterial wilt. Sudden wilting of entire plant without yellowing. White bacterial ooze visible when stem cut. Soil-borne and persistent.',
      treatment: 'No chemical cure for infected plants. Remove and destroy immediately. Solarize soil for 4-6 weeks. Use resistant rootstocks.',
      prevention_tips: JSON.stringify(['Use resistant tomato varieties', 'Avoid waterlogged conditions', 'Disinfect tools between plants', 'Practice long rotations with non-solanaceous crops']),
      issues: JSON.stringify(['Bacterial infection - no cure', 'Soil contamination risk']),
      latitude: 0.0236,
      longitude: 37.9062,
      location_name: 'Meru, Kenya'
    },
    {
      crop_type: 'Bean',
      disease_name: 'Angular Leaf Spot',
      confidence: 84,
      health_score: 62,
      severity: 'medium',
      explanation: 'Phaeoisariopsis griseola causing angular leaf spot. Angular brown lesions limited by leaf veins. Common in humid bean-growing regions across East Africa.',
      treatment: 'Apply mancozeb or copper fungicide. Remove infected leaves. Improve air circulation by proper spacing.',
      prevention_tips: JSON.stringify(['Plant resistant bean varieties (KK8)', 'Avoid working in wet crop', 'Use disease-free seed', 'Crop rotation with cereals']),
      issues: JSON.stringify(['Leaf spotting', 'Pod infection possible']),
      latitude: 1.3733,
      longitude: 32.2903,
      location_name: 'Lira, Uganda'
    }
  ];

  const insertMany = db.transaction((reports) => {
    for (const r of reports) {
      insertDemo.run(
        r.crop_type, r.disease_name, r.confidence, r.health_score,
        r.severity, r.explanation, r.treatment, r.prevention_tips,
        r.issues, r.latitude, r.longitude, r.location_name
      );
    }
  });

  insertMany(demoReports);
  console.log(`[DB] Seeded ${demoReports.length} demo disease reports`);
}

// ─── FUNCTIONS ───────────────────────────────────────────────────────────────

function saveReport(data) {
  const stmt = db.prepare(`
    INSERT INTO disease_reports 
    (crop_type, disease_name, confidence, health_score, severity, explanation, treatment, prevention_tips, issues, latitude, longitude, location_name, farmer_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.crop_type || 'Unknown',
    data.disease_name || 'Unknown',
    data.confidence || 0,
    data.health_score || 50,
    data.severity || 'medium',
    data.explanation || '',
    data.treatment || '',
    typeof data.prevention_tips === 'string' ? data.prevention_tips : JSON.stringify(data.prevention_tips || []),
    typeof data.issues === 'string' ? data.issues : JSON.stringify(data.issues || []),
    data.latitude || null,
    data.longitude || null,
    data.location_name || null,
    data.farmer_name || null
  );
  return result.lastInsertRowid;
}

function getAllReports() {
  const rows = db.prepare('SELECT * FROM disease_reports ORDER BY timestamp DESC').all();
  return rows.map(row => ({
    ...row,
    prevention_tips: safeParseJSON(row.prevention_tips, []),
    issues: safeParseJSON(row.issues, [])
  }));
}

function checkOutbreak(lat, lng, disease, radius = 50) {
  const allReports = db.prepare(
    `SELECT * FROM disease_reports WHERE disease_name LIKE ? AND latitude IS NOT NULL AND longitude IS NOT NULL`
  ).all(`%${disease}%`);

  const nearby = allReports.filter(r => {
    const dist = haversine(lat, lng, r.latitude, r.longitude);
    return dist <= radius;
  });

  return {
    outbreak: nearby.length >= 3,
    count: nearby.length,
    reports: nearby.map(r => ({
      ...r,
      prevention_tips: safeParseJSON(r.prevention_tips, []),
      issues: safeParseJSON(r.issues, [])
    }))
  };
}

function saveHealthLog(data) {
  const stmt = db.prepare(
    'INSERT INTO health_logs (crop_type, health_score, notes) VALUES (?, ?, ?)'
  );
  const result = stmt.run(data.crop_type || 'Unknown', data.health_score || 50, data.notes || '');
  return result.lastInsertRowid;
}

function getHealthHistory(cropType, limit = 30) {
  let query = 'SELECT * FROM health_logs ORDER BY timestamp DESC LIMIT ?';
  let params = [limit];
  if (cropType) {
    query = 'SELECT * FROM health_logs WHERE crop_type = ? ORDER BY timestamp DESC LIMIT ?';
    params = [cropType, limit];
  }
  return db.prepare(query).all(...params);
}

function savePestReport(data) {
  const stmt = db.prepare(`
    INSERT INTO pest_reports
    (pest_name, threat_level, affected_crops, description, symptoms, treatment, prevention, economic_impact, latitude, longitude, location_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.pest_name || 'Unknown',
    data.threat_level || 'MEDIUM',
    data.affected_crops || '',
    data.description || '',
    typeof data.symptoms === 'string' ? data.symptoms : JSON.stringify(data.symptoms || []),
    data.treatment || '',
    typeof data.prevention === 'string' ? data.prevention : JSON.stringify(data.prevention || []),
    data.economic_impact || '',
    data.latitude || null,
    data.longitude || null,
    data.location_name || null
  );
  return result.lastInsertRowid;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function safeParseJSON(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

module.exports = { saveReport, getAllReports, checkOutbreak, saveHealthLog, getHealthHistory, savePestReport };
