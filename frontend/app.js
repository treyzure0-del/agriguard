/* =========================================================
   AgriGuard AI — Frontend Application
   ========================================================= */
 
'use strict';
 
// ─── SECTION 1: STATE ────────────────────────────────────────────────────────
 
let selectedCrop = 'Maize';
let conversationHistory = [];
let scanHistory = [];
let totalScans = 0;
let mapInstance = null;
let mapInitialized = false;
let currentImageFile = null;
let cameraStream = null;
let healthChart = null;
 
const CROP_ICONS = {
  'Maize': '🌽', 'Cassava': '🌿', 'Tomato': '🍅', 'Bean': '🫘',
  'Potato': '🥔', 'Banana': '🍌', 'Coffee': '☕', 'Sorghum': '🌾',
  'Default': '🌱'
};
 
const PEST_DATA = {
  'Fall Armyworm': {
    icon: '🐛', threat: 'CRITICAL',
    affected: 'Maize, Sorghum, Rice, Sugarcane',
    description: 'Spodoptera frugiperda — the most destructive maize pest in Africa. Larvae bore into plant whorls and ears, causing catastrophic yield losses of 20–73%. Spreads rapidly across large areas.',
    symptoms: ['Ragged holes in leaves from feeding', 'Frass (droppings) visible in leaf whorls', 'Larvae visible at night or early morning', 'Deformed or dead central shoot (dead heart)', 'Damaged ear tips with entry holes'],
    treatment: 'Apply emamectin benzoate (Escort) or chlorantraniliprole (Coragen). For organic: mix ash + sand into plant whorls. Early morning spray most effective.',
    prevention: ['Scout fields twice weekly', 'Plant early to avoid peak moth flights', 'Intercrop with legumes', 'Use pheromone traps for monitoring', 'Destroy crop residues after harvest'],
    impact: 'Can destroy entire maize crop. Causes $9+ billion losses annually in Africa.'
  },
  'Desert Locust': {
    icon: '🦗', threat: 'CRITICAL',
    affected: 'All crops — maize, wheat, sorghum, vegetables',
    description: 'Schistocerca gregaria — swarms of millions consume every crop in hours. A single swarm can contain 80 million locusts consuming 80+ tonnes of vegetation per day.',
    symptoms: ['Sudden complete defoliation of crops', 'Large swarms visible in sky', 'Egg pods found in soil', 'Stripped bare fields overnight', 'Hopper bands on ground'],
    treatment: 'Report immediately to National Locust Control (FAO coordinates response). Apply organophosphate insecticides via aerial or ground spray if authorized.',
    prevention: ['Monitor LOCUST FAO early warning alerts', 'Community reporting systems', 'Coordinate with government pest control', 'Barrier treatments around fields'],
    impact: 'A single swarm feeds 35,000 people per day. 2020 outbreak destroyed $8.5B crops in East Africa.'
  },
  'Aphids': {
    icon: '🦟', threat: 'HIGH',
    affected: 'Cassava, Beans, Tomatoes, Potatoes, Coffee',
    description: 'Multiple Aphis species that suck plant sap and transmit deadly viruses. Cassava Green Mite and Bean Aphid cause serious losses. Secondary virus transmission is often more damaging than direct feeding.',
    symptoms: ['Yellow curling leaves', 'Sticky honeydew on leaves causing sooty mold', 'Stunted plant growth', 'Colonies visible on undersides of leaves', 'Virus symptoms: mosaic or yellowing patterns'],
    treatment: 'Spray with imidacloprid or acetamiprid. Organic: neem oil solution (5ml/L), soapy water spray. Remove heavily infested shoots.',
    prevention: ['Inspect new planting material', 'Encourage natural enemies (ladybirds)', 'Use reflective mulch to repel aphids', 'Avoid excessive nitrogen fertilizer', 'Plant resistant varieties'],
    impact: 'Cassava mosaic spread by aphids causes 30–72% yield loss in Uganda and Kenya.'
  },
  'Whitefly': {
    icon: '🦋', threat: 'HIGH',
    affected: 'Cassava, Tomatoes, Beans, Sweet Potato',
    description: 'Bemisia tabaci and Trialeurodes vaporariorum. Major vector of cassava mosaic and brown streak viruses. Populations explode during dry season causing direct damage and catastrophic virus transmission.',
    symptoms: ['White insects fly up when plant disturbed', 'Yellow stippling on upper leaf surface', 'Sticky honeydew and black sooty mold', 'Leaf curl and chlorosis', 'Plant stunting and death in severe cases'],
    treatment: 'Apply thiamethoxam (Actara) or spirotetramat (Movento) at first sign. Yellow sticky traps help monitor population. Avoid repeated pyrethroids (resistance risk).',
    prevention: ['Use certified virus-free cassava cuttings', 'Intercrop with repellent plants (basil)', 'Install yellow sticky traps', 'Remove virus-infected plants immediately', 'Plant during rainy season when populations are lower'],
    impact: 'Cassava viruses spread by whitefly cause $1–2 billion losses annually in East Africa.'
  },
  'Stalk Borer': {
    icon: '🐜', threat: 'MEDIUM',
    affected: 'Maize, Sorghum, Sugarcane, Millet',
    description: 'Busseola fusca (maize stalk borer) and Chilo partellus (spotted stalk borer). Larvae tunnel into stems causing dead heart symptom in young plants and stem breakage before harvest.',
    symptoms: ['Dead central leaf ("dead heart") in young plants', 'Pin holes in leaves', 'Frass on leaf surface', 'Stem tunneling visible when split', 'Lodging (stem breakage) in older plants'],
    treatment: 'Apply granular carbofuran into plant whorls at 3–4 weeks after emergence. Spray with cypermethrin at egg hatching. Biological: release Cotesia flavipes parasitoid.',
    prevention: ['Plant early (first rains)', 'Remove and destroy old crop stalks', 'Deep plow to kill pupae', 'Use push-pull technology (Desmodium intercrop)', 'Avoid late planting'],
    impact: 'Causes 20–40% maize yield losses in East Africa. Major constraint in Tanzania and Uganda.'
  },
  'Thrips': {
    icon: '🦠', threat: 'MEDIUM',
    affected: 'Onions, Tomatoes, Beans, Chilli, Pepper',
    description: 'Thrips tabaci and Frankliniella occidentalis. Tiny insects that rasp plant surfaces causing silvery scarring. Major vectors of Tomato Spotted Wilt Virus (TSWV) which has no cure.',
    symptoms: ['Silver streaks and patches on leaves', 'Distorted and curled young leaves', 'Black faecal spots on leaves', 'Flower damage and abortion', 'Virus symptoms if TSWV transmitted'],
    treatment: 'Apply spinosad (Entrust) or abamectin (Dynamec). Spray during early morning or evening. Alternate chemicals to prevent resistance.',
    prevention: ['Use reflective mulch to repel thrips', 'Install blue sticky traps', 'Avoid planting next to old onion/tomato fields', 'Regular irrigation (thrips prefer dry conditions)', 'Plant resistant varieties'],
    impact: 'TSWV transmitted by thrips can cause 50–100% losses in tomato and pepper crops.'
  }
};
 
// ─── SECTION 2: PAGE NAVIGATION ──────────────────────────────────────────────
 
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.navbar-links a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
 
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
 
  const navLink = document.querySelector(`[data-page="${name}"]`);
  if (navLink) navLink.classList.add('active');
 
  const mobileBtn = document.querySelector(`.mobile-nav-item[data-page="${name}"]`);
  if (mobileBtn) mobileBtn.classList.add('active');
 
  if (name === 'map' && !mapInitialized) {
    setTimeout(initMap, 100);
  }
  if (name === 'dashboard') {
    loadDashboard();
  }
 
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
// ─── SECTION 3: HOME PAGE ────────────────────────────────────────────────────
 
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      counter.textContent = current.toLocaleString() + (counter.getAttribute('data-suffix') || '');
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}
 
// ─── SECTION 4: SCAN PAGE ────────────────────────────────────────────────────
 
function selectCrop(btn) {
  document.querySelectorAll('.crop-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCrop = btn.getAttribute('data-crop');
}
 
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadImagePreview(file);
}
 
function loadImagePreview(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Please select an image file');
    return;
  }
  currentImageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('imagePreview');
    const img = document.getElementById('previewImg');
    if (preview && img) {
      img.src = e.target.result;
      preview.classList.add('visible');
    }
  };
  reader.readAsDataURL(file);
 
  document.getElementById('resultsSection').classList.remove('visible');
  document.getElementById('scanBtn').disabled = false;
}
 
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
 
function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
 
function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadImagePreview(file);
}
 
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    cameraStream = stream;
    const video = document.getElementById('cameraView');
    video.srcObject = stream;
    video.style.display = 'block';
    video.play();
    document.getElementById('startCameraBtn').style.display = 'none';
    document.getElementById('captureBtn').style.display = 'inline-flex';
    document.getElementById('stopCameraBtn').style.display = 'inline-flex';
  } catch (err) {
    showError('Camera access denied. Please allow camera permissions and use http://localhost:3000');
  }
}
 
function capturePhoto() {
  const video = document.getElementById('cameraView');
  const canvas = document.getElementById('captureCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    if (blob) {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      loadImagePreview(file);
    }
  }, 'image/jpeg', 0.92);
  stopCamera();
}
 
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  const video = document.getElementById('cameraView');
  video.style.display = 'none';
  document.getElementById('startCameraBtn').style.display = 'inline-flex';
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('stopCameraBtn').style.display = 'none';
}
 
const SCAN_STEPS = [
  { text: 'Uploading image...', sub: 'Preparing for analysis', progress: 15 },
  { text: 'Analyzing crop...', sub: 'Identifying plant species', progress: 40 },
  { text: 'Scanning for disease...', sub: 'Checking against 200+ conditions', progress: 70 },
  { text: 'Generating report...', sub: 'Preparing treatment plan', progress: 90 }
];
 
async function startScanAnimation() {
  const scanAnim = document.getElementById('scanAnimation');
  const scanStatus = document.getElementById('scanStatus');
  const scanSub = document.getElementById('scanSub');
  const scanBar = document.getElementById('scanProgressBar');
  const scanBtn = document.getElementById('scanBtn');
  const uploadArea = document.getElementById('uploadArea');
 
  scanBtn.disabled = true;
  uploadArea.style.display = 'none';
  scanAnim.classList.add('active');
 
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < SCAN_STEPS.length) {
      const step = SCAN_STEPS[stepIdx];
      scanStatus.textContent = step.text;
      scanSub.textContent = step.sub;
      scanBar.style.width = step.progress + '%';
      stepIdx++;
    }
  }, 750);
 
  await new Promise(r => setTimeout(r, 500));
  const result = await submitScan();
 
  clearInterval(stepInterval);
  scanBar.style.width = '100%';
  scanStatus.textContent = 'Analysis complete!';
  scanSub.textContent = 'View your results below';
 
  await new Promise(r => setTimeout(r, 600));
 
  scanAnim.classList.remove('active');
  uploadArea.style.display = 'block';
  scanBtn.disabled = false;
 
  if (result) showResults(result);
}
 
async function submitScan() {
  if (!currentImageFile) {
    showError('Please select an image first');
    return null;
  }
 
  const formData = new FormData();
  formData.append('image', currentImageFile);
  formData.append('crop_type', selectedCrop);
 
  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    totalScans++;
    updateScanCount();
    return data;
  } catch (err) {
    console.error('[scan] Error:', err);
    showError('Scan failed. Check your API key in backend/.env and try again.');
    return null;
  }
}
 
function showResults(data) {
  if (!data) return;
 
  const section = document.getElementById('resultsSection');
  section.classList.add('visible');
 
  // Header
  document.getElementById('resultCrop').textContent = data.crop_type || 'Unknown Crop';
  document.getElementById('resultDisease').textContent = data.disease_name || 'Unknown';
  document.getElementById('resultConfidence').textContent = (data.confidence || 0) + '% Confidence';
 
  // Severity tag
  const sevEl = document.getElementById('resultSeverity');
  const sev = (data.severity || 'medium').toLowerCase();
  sevEl.className = `severity-tag ${sev}`;
  sevEl.textContent = sev.charAt(0).toUpperCase() + sev.slice(1) + ' Severity';
 
  // Health score bar
  const score = data.health_score || 50;
  document.getElementById('resultHealthScore').textContent = score + '%';
  const fill = document.getElementById('resultHealthFill');
  fill.className = `health-bar-fill ${score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'}`;
  setTimeout(() => { fill.style.width = score + '%'; }, 100);
 
  // Texts
  document.getElementById('resultExplanation').textContent = data.explanation || '';
  document.getElementById('resultTreatment').textContent = data.treatment || '';
 
  // Tips
  const tipsList = document.getElementById('resultTips');
  tipsList.innerHTML = '';
  (data.prevention_tips || []).forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });
 
  // Issues
  const issuesList = document.getElementById('resultIssues');
  issuesList.innerHTML = '';
  (data.issues || []).forEach(issue => {
    const span = document.createElement('span');
    span.className = 'issue-tag';
    span.textContent = issue;
    issuesList.appendChild(span);
  });
 
  // Add to scan history
  scanHistory.unshift({
    crop_type: data.crop_type,
    disease_name: data.disease_name,
    health_score: data.health_score,
    timestamp: new Date().toISOString()
  });
 
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
function updateScanCount() {
  const el = document.getElementById('scanCount');
  if (el) el.textContent = totalScans;
}
 
// ─── SECTION 5: AI ADVISOR ────────────────────────────────────────────────────
 
async function sendAdvisorMessage(text) {
  if (!text || !text.trim()) return;
 
  const input = document.getElementById('chatInput');
  if (input) input.value = '';
  input.style.height = 'auto';
 
  addMessage(escapeHtml(text), 'user');
  conversationHistory.push({ role: 'user', content: text });
 
  showTypingIndicator();
 
  try {
    const response = await fetch('/api/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });
 
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    const reply = data.response || "Sorry, I couldn't process that. Please try again.";
 
    conversationHistory.push({ role: 'assistant', content: reply });
    hideTypingIndicator();
    addMessage(renderMarkdown(reply), 'assistant', true);
 
  } catch (err) {
    console.error('[advisor] Error:', err);
    hideTypingIndicator();
    addMessage("I'm having trouble connecting right now. Please check your API key in the .env file.", 'assistant');
  }
}
 
function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);
 
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
 
  // Numbered lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');
 
  // Bullet lists (- or • or *)
  html = html.replace(/^[-•*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(?<!<\/ol>)(<li>.*<\/li>\n?)+/g, m => {
    if (!m.includes('<ol>')) return `<ul>${m}</ul>`;
    return m;
  });
 
  // Headers
  html = html.replace(/^#{3}\s+(.+)$/gm, '<strong>$1</strong>');
  html = html.replace(/^#{1,2}\s+(.+)$/gm, '<strong style="font-size:1.05em">$1</strong>');
 
  // Paragraphs / line breaks
  html = html.replace(/\n\n+/g, '<br><br>');
  html = html.replace(/\n(?!<)/g, '<br>');
 
  return html;
}
 
function addMessage(content, role, isHtml = false) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
 
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message ${role}`;
 
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  if (isHtml) {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }
 
  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 
  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}
 
function showTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.classList.add('visible');
    const messages = document.getElementById('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }
}
 
function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.classList.remove('visible');
}
 
function clearChat() {
  conversationHistory = [];
  const messages = document.getElementById('chatMessages');
  if (messages) {
    messages.innerHTML = '';
    // Add welcome message back
    addMessage(renderMarkdown('Hello! I\'m **AgriGuard AI**, your expert agricultural advisor for East Africa. 🌱\n\nAsk me about crop diseases, pest management, soil health, fertilizers, or any farming challenge you face. I\'m here to help!'), 'assistant', true);
  }
}
 
// ─── SECTION 6: DISEASE MAP ───────────────────────────────────────────────────
 
function initMap() {
  if (mapInitialized) return;
 
  const mapEl = document.getElementById('diseaseMap');
  if (!mapEl || typeof L === 'undefined') {
    console.warn('[map] Leaflet not loaded or map element missing');
    return;
  }
 
  mapInstance = L.map('diseaseMap', {
    center: [1.3733, 32.2903],
    zoom: 6,
    zoomControl: true
  });
 
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(mapInstance);
 
  mapInitialized = true;
  loadMapData();
 
  // Auto-refresh every 60 seconds
  setInterval(loadMapData, 60000);
}
 
async function loadMapData() {
  if (!mapInstance) return;
 
  try {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    const reports = await response.json();
 
    // Clear existing markers
    mapInstance.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) mapInstance.removeLayer(layer);
    });
 
    let outbreakCount = 0;
    let highCount = 0;
 
    reports.forEach(report => {
      if (!report.latitude || !report.longitude) return;
 
      const score = report.health_score || 50;
      const isOutbreak = score < 30;
      const isHigh = score < 50;
      const isMedium = score < 70;
 
      let color, radius;
      if (isOutbreak) {
        color = '#e63946'; radius = 14; outbreakCount++;
      } else if (isHigh) {
        color = '#ff9f1c'; radius = 11; highCount++;
      } else if (isMedium) {
        color = '#f5c842'; radius = 9;
      } else {
        color = '#5ed97e'; radius = 8;
      }
 
      const icon = CROP_ICONS[report.crop_type] || CROP_ICONS['Default'];
      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius,
        fillColor: color,
        color: 'rgba(0,0,0,0.3)',
        weight: 1,
        fillOpacity: 0.85
      });
 
      const scoreColor = score >= 70 ? '#5ed97e' : score >= 40 ? '#f5c842' : '#e63946';
      marker.bindPopup(`
        <div class="popup-crop">${icon} ${report.crop_type}</div>
        <div class="popup-disease">${report.disease_name}</div>
        <div class="popup-location">📍 ${report.location_name || 'Unknown location'}</div>
        <span class="popup-score" style="background:${scoreColor}20;color:${scoreColor}">
          Health: ${report.health_score || '—'}%
        </span>
      `);
 
      marker.addTo(mapInstance);
    });
 
    // Update map stats
    const totalEl = document.getElementById('mapTotalReports');
    const outbreakEl = document.getElementById('mapOutbreaks');
    const countriesEl = document.getElementById('mapCountries');
    if (totalEl) totalEl.textContent = reports.length;
    if (outbreakEl) outbreakEl.textContent = outbreakCount;
    if (countriesEl) countriesEl.textContent = '3+';
 
  } catch (err) {
    console.error('[map] Load failed:', err.message);
  }
}
 
// ─── SECTION 7: DASHBOARD ─────────────────────────────────────────────────────
 
async function loadDashboard() {
  try {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed');
    const reports = await response.json();
 
    totalScans = reports.filter(r => !r.is_demo).length + totalScans;
    const el = document.getElementById('dashTotalScans');
    if (el) el.textContent = reports.length;
 
    const healthyCount = reports.filter(r => r.health_score >= 70).length;
    const diseasedCount = reports.filter(r => r.health_score < 70).length;
    const avgHealth = Math.round(reports.reduce((sum, r) => sum + (r.health_score || 50), 0) / reports.length);
 
    const hEl = document.getElementById('dashHealthy');
    const dEl = document.getElementById('dashDiseased');
    const avgEl = document.getElementById('dashAvgHealth');
    if (hEl) hEl.textContent = healthyCount;
    if (dEl) dEl.textContent = diseasedCount;
    if (avgEl) avgEl.textContent = avgHealth + '%';
 
    renderScanHistory(reports.slice(0, 6));
    renderAlerts(reports);
    initHealthChart(reports);
    renderHealthOverview(reports);
 
  } catch (err) {
    console.error('[dashboard] Load failed:', err.message);
  }
}
 
function renderScanHistory(reports) {
  const container = document.getElementById('scanHistoryList');
  if (!container) return;
  container.innerHTML = '';
 
  if (reports.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px">No scans yet. Try scanning a crop leaf!</p>';
    return;
  }
 
  reports.slice(0, 6).forEach(r => {
    const score = r.health_score || 50;
    const icon = CROP_ICONS[r.crop_type] || CROP_ICONS['Default'];
    const fillColor = score >= 70 ? 'var(--lime)' : score >= 40 ? 'var(--gold)' : 'var(--crimson)';
 
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-icon">${icon}</div>
      <div class="history-info">
        <div class="history-crop">${r.crop_type}</div>
        <div class="history-disease">${r.disease_name} · ${formatTimeAgo(r.timestamp)}</div>
      </div>
      <div class="history-mini-bar">
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${score}%;background:${fillColor}"></div>
        </div>
        <div class="mini-score">${score}%</div>
      </div>
    `;
    container.appendChild(item);
  });
}
 
function renderAlerts(reports) {
  const container = document.getElementById('alertsList');
  if (!container) return;
  container.innerHTML = '';
 
  const diseased = reports.filter(r => r.health_score < 40).slice(0, 3);
  if (diseased.length === 0) {
    container.innerHTML = '<div class="alert-item info"><span class="alert-icon">✅</span><div><div class="alert-title">All crops healthy</div><div class="alert-desc">No critical alerts at this time</div></div></div>';
    return;
  }
 
  diseased.forEach(r => {
    const type = r.health_score < 25 ? 'danger' : 'warning';
    const icon = r.health_score < 25 ? '🚨' : '⚠️';
    const item = document.createElement('div');
    item.className = `alert-item ${type}`;
    item.innerHTML = `
      <span class="alert-icon">${icon}</span>
      <div>
        <div class="alert-title">${r.crop_type}: ${r.disease_name}</div>
        <div class="alert-desc">${r.location_name || 'Unknown location'} · Score: ${r.health_score}%</div>
      </div>
    `;
    container.appendChild(item);
  });
}
 
function initHealthChart(reports) {
  const canvas = document.getElementById('healthChart');
  if (!canvas || typeof Chart === 'undefined') return;
 
  if (healthChart) healthChart.destroy();
 
  // Build chart data from reports or demo
  let labels, data;
  if (reports.length >= 3) {
    const recent = reports.slice(0, 10).reverse();
    labels = recent.map(r => r.crop_type.slice(0, 4));
    data = recent.map(r => r.health_score || 50);
  } else {
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    data = [78, 65, 72, 58, 80, 75];
  }
 
  healthChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Crop Health Score',
        data,
        borderColor: '#5ed97e',
        backgroundColor: 'rgba(94, 217, 126, 0.10)',
        borderWidth: 2.5,
        pointBackgroundColor: '#5ed97e',
        pointBorderColor: '#0d2b1a',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: 'rgba(200,230,210,0.6)',
            font: { size: 11 },
            callback: v => v + '%'
          }
        },
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(200,230,210,0.6)', font: { size: 11 } }
        }
      }
    }
  });
}
 
function renderHealthOverview(reports) {
  const container = document.getElementById('healthOverview');
  if (!container) return;
 
  const cropScores = {};
  reports.forEach(r => {
    if (!cropScores[r.crop_type]) cropScores[r.crop_type] = [];
    cropScores[r.crop_type].push(r.health_score || 50);
  });
 
  const crops = Object.entries(cropScores).slice(0, 5);
  container.innerHTML = '';
 
  crops.forEach(([crop, scores]) => {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const fillColor = avg >= 70 ? '#5ed97e' : avg >= 40 ? '#f5c842' : '#e63946';
    const item = document.createElement('div');
    item.className = 'health-overview-item';
    item.innerHTML = `
      <div class="health-overview-header">
        <span class="health-overview-crop">${CROP_ICONS[crop] || '🌱'} ${crop}</span>
        <span class="health-overview-score">${avg}%</span>
      </div>
      <div class="health-overview-bar">
        <div class="health-overview-fill" style="width:${avg}%;background:${fillColor}"></div>
      </div>
    `;
    container.appendChild(item);
  });
}
 
// ─── SECTION 8: PEST DETECTION ────────────────────────────────────────────────
 
function selectPest(card, name) {
  document.querySelectorAll('.pest-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  showPestInfo(name);
}
 
function showPestInfo(name) {
  const pest = PEST_DATA[name];
  if (!pest) return;
 
  const card = document.getElementById('pestInfoCard');
  if (!card) return;
  card.classList.add('visible');
 
  document.getElementById('pestInfoName').textContent = name;
  const tBadge = document.getElementById('pestInfoThreat');
  tBadge.className = `threat-badge ${pest.threat}`;
  tBadge.textContent = pest.threat;
 
  document.getElementById('pestInfoCrops').textContent = pest.affected;
  document.getElementById('pestInfoDesc').textContent = pest.description;
  document.getElementById('pestInfoImpact').textContent = pest.economic_impact || pest.impact;
  document.getElementById('pestInfoTreatment').textContent = pest.treatment;
 
  const symList = document.getElementById('pestInfoSymptoms');
  symList.innerHTML = '';
  pest.symptoms.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    symList.appendChild(li);
  });
 
  const prevList = document.getElementById('pestInfoPrevention');
  prevList.innerHTML = '';
  pest.prevention.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    prevList.appendChild(li);
  });
 
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
 
async function handlePestImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Please select an image file');
    return;
  }
 
  const btn = document.getElementById('analyzePestBtn');
  if (btn) { btn.disabled = true; btn.textContent = '🔍 Analyzing...'; }
 
  const formData = new FormData();
  formData.append('image', file);
 
  try {
    const response = await fetch('/api/pest', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    showPestResult(data);
  } catch (err) {
    console.error('[pest] Error:', err);
    showError('Pest analysis failed. Check your API key and try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Analyze for Pests'; }
  }
}
 
function showPestResult(data) {
  const card = document.getElementById('pestResultCard');
  if (!card) return;
  card.classList.add('visible');
 
  document.getElementById('pestResultName').textContent = data.pest_name || 'Unknown';
  const tBadge = document.getElementById('pestResultThreat');
  tBadge.className = `threat-badge ${data.threat_level || 'MEDIUM'}`;
  tBadge.textContent = data.threat_level || 'MEDIUM';
 
  document.getElementById('pestResultCrops').textContent = data.affected_crops || '';
  document.getElementById('pestResultDesc').textContent = data.description || '';
  document.getElementById('pestResultTreatment').textContent = data.treatment || '';
  document.getElementById('pestResultImpact').textContent = data.economic_impact || '';
 
  const symList = document.getElementById('pestResultSymptoms');
  symList.innerHTML = '';
  (data.symptoms || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    symList.appendChild(li);
  });
 
  const prevList = document.getElementById('pestResultPrevention');
  prevList.innerHTML = '';
  (data.prevention || []).forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    prevList.appendChild(li);
  });
 
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
// ─── SECTION 9: UTILITIES ─────────────────────────────────────────────────────
 
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown time';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
 
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
 
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
 
let toastTimeout;
function showToast(message, type = 'success') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
 
function showError(message) { showToast('⚠️ ' + message, 'error'); }
function showSuccess(message) { showToast('✓ ' + message, 'success'); }
 
// ─── SECTION 10: INIT ─────────────────────────────────────────────────────────
 
document.addEventListener('DOMContentLoaded', () => {
  // Set dashboard date
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
 
  // Initial page
  showPage('home');
  setTimeout(animateCounters, 300);
 
  // Load initial scan count from API
  fetch('/api/reports')
    .then(r => r.json())
    .then(reports => {
      totalScans = reports.filter(r => !r.is_demo).length;
      const el = document.getElementById('scanCount');
      if (el) el.textContent = reports.length;
    })
    .catch(() => {});
 
  // Nav links
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showPage(el.getAttribute('data-page'));
    });
  });
 
  // Scan page: file upload
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.addEventListener('change', handleFileSelect);
 
  const uploadZone = document.getElementById('uploadZone');
  if (uploadZone) {
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
  }
 
  // Scan button
  const scanBtn = document.getElementById('scanBtn');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      if (!currentImageFile) {
        showError('Please select or capture an image first');
        return;
      }
      startScanAnimation();
    });
  }
 
  // Camera buttons
  const startCamBtn = document.getElementById('startCameraBtn');
  if (startCamBtn) startCamBtn.addEventListener('click', startCamera);
  const captureBtn = document.getElementById('captureBtn');
  if (captureBtn) captureBtn.addEventListener('click', capturePhoto);
  const stopCamBtn = document.getElementById('stopCameraBtn');
  if (stopCamBtn) stopCamBtn.addEventListener('click', stopCamera);
 
  // Chat input
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) sendAdvisorMessage(text);
      }
    });
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
  }
 
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const text = chatInput?.value.trim();
      if (text) sendAdvisorMessage(text);
    });
  }
 
  const clearBtn = document.getElementById('clearChatBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearChat);
 
  // Quick questions
  document.querySelectorAll('.quick-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showPage('advisor');
      sendAdvisorMessage(btn.getAttribute('data-question'));
    });
  });
 
  // Pest upload
  const pestFileInput = document.getElementById('pestFileInput');
  if (pestFileInput) {
    pestFileInput.addEventListener('change', e => {
      if (e.target.files[0]) handlePestImageUpload(e.target.files[0]);
    });
  }
 
  const analyzePestBtn = document.getElementById('analyzePestBtn');
  if (analyzePestBtn) {
    analyzePestBtn.addEventListener('click', () => {
      if (pestFileInput) pestFileInput.click();
    });
  }
 
  // Map refresh button
  const refreshMapBtn = document.getElementById('refreshMapBtn');
  if (refreshMapBtn) {
    refreshMapBtn.addEventListener('click', loadMapData);
  }
 
  // Add welcome message to chat
  setTimeout(() => {
    addMessage(renderMarkdown('Hello! I\'m **AgriGuard AI**, your expert agricultural advisor for East Africa. 🌱\n\nAsk me about crop diseases, pest management, soil health, fertilizers, or any farming challenge you face. I\'m here to help!'), 'assistant', true);
  }, 200);
});
 
/* =========================================================
   SECTION 11: AUTH — Slide-in Panel, Advisor Lock
   ========================================================= */
 
// ─── STATE ────────────────────────────────────────────────
let currentUser = null;
let authToken = null;
 
// ─── STORAGE ──────────────────────────────────────────────
function loadAuth() {
  try {
    const t = localStorage.getItem('ag_token');
    const u = localStorage.getItem('ag_user');
    if (t && u) { authToken = t; currentUser = JSON.parse(u); }
  } catch { clearAuth(); }
}
 
function saveAuth(token, user) {
  localStorage.setItem('ag_token', token);
  localStorage.setItem('ag_user', JSON.stringify(user));
  authToken = token;
  currentUser = user;
}
 
function clearAuth() {
  localStorage.removeItem('ag_token');
  localStorage.removeItem('ag_user');
  authToken = null;
  currentUser = null;
}
 
// ─── PANEL OPEN/CLOSE ─────────────────────────────────────
function openAuthPanel(tab) {
  document.getElementById('authPanel').classList.add('open');
  document.getElementById('authBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (tab) switchTab(tab);
  clearErrors();
}
 
function closeAuthPanel() {
  document.getElementById('authPanel').classList.remove('open');
  document.getElementById('authBackdrop').classList.remove('open');
  document.body.style.overflow = '';
  clearErrors();
}
 
function switchTab(tab) {
  const loginEl = document.getElementById('panelLogin');
  const signupEl = document.getElementById('panelSignup');
  const histEl = document.getElementById('panelHistory');
  const tLogin = document.getElementById('tabLogin');
  const tSignup = document.getElementById('tabSignup');
 
  [loginEl, signupEl, histEl].forEach(el => { if (el) el.style.display = 'none'; });
  [tLogin, tSignup].forEach(el => { if (el) el.classList.remove('active'); });
 
  if (tab === 'login') {
    if (loginEl) loginEl.style.display = 'block';
    if (tLogin) tLogin.classList.add('active');
  } else if (tab === 'signup') {
    if (signupEl) signupEl.style.display = 'block';
    if (tSignup) tSignup.classList.add('active');
  } else if (tab === 'history') {
    if (histEl) histEl.style.display = 'block';
    loadChatHistoryPanel();
  }
  clearErrors();
}
 
// Show chat history — opens panel to history tab
function showChatHistory() {
  openAuthPanel(null);
  // Hide tabs, show history directly
  document.getElementById('panelLogin').style.display = 'none';
  document.getElementById('panelSignup').style.display = 'none';
  document.getElementById('panelHistory').style.display = 'block';
  document.getElementById('tabLogin').classList.remove('active');
  document.getElementById('tabSignup').classList.remove('active');
  loadChatHistoryPanel();
}
 
// ─── USER DROPDOWN ────────────────────────────────────────
function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd) dd.classList.toggle('open');
  if (pill) pill.classList.toggle('open');
}
 
function closeUserMenu() {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd) dd.classList.remove('open');
  if (pill) pill.classList.remove('open');
}
 
document.addEventListener('click', e => {
  const dd = document.getElementById('userDropdown');
  const pill = document.getElementById('navUserPill');
  if (dd && pill && !dd.contains(e.target) && !pill.contains(e.target)) closeUserMenu();
});
 
// ─── UI STATE ─────────────────────────────────────────────
function updateAuthUI() {
  const authBtn = document.getElementById('navAuthBtn');
  const userPill = document.getElementById('navUserPill');
  const navAvatar = document.getElementById('navAvatar');
  const navUserName = document.getElementById('navUserName');
  const dropAvatar = document.getElementById('dropAvatar');
  const dropName = document.getElementById('dropName');
  const dropEmail = document.getElementById('dropEmail');
  const advisorLock = document.getElementById('advisorLock');
  const advisorChat = document.getElementById('advisorChat');
 
  if (currentUser) {
    if (authBtn) authBtn.style.display = 'none';
    if (userPill) userPill.style.display = 'flex';
 
    const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
    if (navAvatar) navAvatar.textContent = initial;
    if (navUserName) navUserName.textContent = currentUser.name.split(' ')[0];
    if (dropAvatar) dropAvatar.textContent = initial;
    if (dropName) dropName.textContent = currentUser.name;
    if (dropEmail) dropEmail.textContent = currentUser.email;
 
    // Show advisor chat, hide lock
    if (advisorLock) advisorLock.style.display = 'none';
    if (advisorChat) advisorChat.style.display = 'grid';
 
  } else {
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userPill) userPill.style.display = 'none';
 
    // Show lock, hide chat
    if (advisorLock) advisorLock.style.display = 'flex';
    if (advisorChat) advisorChat.style.display = 'none';
  }
}
 
// ─── SIGN UP ──────────────────────────────────────────────
async function handleSignup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value;
 
  if (!name || !email || !password) { showErr('signup', 'Please fill in all fields'); return; }
 
  setBtnLoading('signupBtn', true, 'Creating account...');
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { showErr('signup', data.error || 'Signup failed'); return; }
 
    saveAuth(data.token, data.user);
    updateAuthUI();
    closeAuthPanel();
    clearChatAndHistory();
    showSuccess(`Welcome to AgriGuard AI, ${data.user.name}! 🌿`);
 
    // If on advisor page, welcome message
    if (document.getElementById('page-advisor').classList.contains('active')) {
      setTimeout(() => {
        addMessage(`Hi ${data.user.name}! 👋 I'm your personal AI farming advisor. Ask me anything about crops, pests, soil, or diseases in East Africa.`, 'assistant');
      }, 400);
    }
  } catch { showErr('signup', 'Network error. Please try again.'); }
  finally { setBtnLoading('signupBtn', false, 'Create Free Account'); }
}
 
// ─── LOG IN ───────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value;
 
  if (!email || !password) { showErr('login', 'Please enter your email and password'); return; }
 
  setBtnLoading('loginBtn', true, 'Signing in...');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { showErr('login', data.error || 'Login failed'); return; }
 
    saveAuth(data.token, data.user);
    updateAuthUI();
    closeAuthPanel();
    showSuccess(`Welcome back, ${data.user.name}! 👋`);
 
    // Add welcome back message to chat
    if (document.getElementById('page-advisor').classList.contains('active')) {
      setTimeout(() => {
        addMessage(`Welcome back, ${data.user.name}! 🌿 Ready to help with your crops. What would you like to know today?`, 'assistant');
      }, 400);
    }
  } catch { showErr('login', 'Network error. Please try again.'); }
  finally { setBtnLoading('loginBtn', false, 'Sign In'); }
}
 
// ─── LOG OUT ──────────────────────────────────────────────
async function handleLogout() {
  closeUserMenu();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
  } catch {}
  clearAuth();
  conversationHistory = [];
  clearChatAndHistory();
  updateAuthUI();
  showSuccess('Signed out. See you next time! 👋');
}
 
function clearChatAndHistory() {
  conversationHistory = [];
  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.innerHTML = `
    <div class="typing-indicator" id="typingIndicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
}
 
// ─── CHAT HISTORY ─────────────────────────────────────────
async function loadChatHistoryPanel() {
  const container = document.getElementById('historyList');
  if (!container || !authToken) return;
 
  container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">Loading...</p>';
 
  try {
    const res = await fetch('/api/auth/chat-history', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error('Failed');
    const history = await res.json();
 
    if (history.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">No saved chats yet.<br>Start a conversation with the AI Advisor!</p>';
      return;
    }
 
    container.innerHTML = '';
    history.slice(-40).forEach(msg => {
      const item = document.createElement('div');
      item.className = 'chat-history-item';
      item.innerHTML = `
        <span class="chi-role ${msg.role}">${msg.role === 'user' ? 'You' : 'AI'}</span>
        <span class="chi-text">${escapeHtml(msg.content)}</span>
      `;
      container.appendChild(item);
    });
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  } catch {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:14px;text-align:center;padding:20px 0">Could not load history.</p>';
  }
}
 
// ─── OVERRIDE sendAdvisorMessage TO SEND AUTH TOKEN ───────
const _origSend = sendAdvisorMessage;
sendAdvisorMessage = async function(text) {
  if (!text || !text.trim()) return;
 
  // If not logged in, open auth panel
  if (!currentUser) {
    openAuthPanel('login');
    showToast('⚠️ Please sign in to use the AI Advisor', 'error');
    return;
  }
 
  const input = document.getElementById('chatInput');
  if (input) { input.value = ''; input.style.height = 'auto'; }
 
  addMessage(escapeHtml(text), 'user');
  conversationHistory.push({ role: 'user', content: text });
  showTypingIndicator();
 
  try {
    const res = await fetch('/api/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ messages: conversationHistory })
    });
 
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const reply = data.response || "Sorry, I couldn't process that.";
 
    conversationHistory.push({ role: 'assistant', content: reply });
    hideTypingIndicator();
    addMessage(renderMarkdown(reply), 'assistant', true);
 
  } catch (err) {
    hideTypingIndicator();
    if (err.message === '401') {
      addMessage('Your session expired. Please sign in again.', 'assistant');
      clearAuth();
      updateAuthUI();
      setTimeout(() => openAuthPanel('login'), 1000);
    } else {
      addMessage("I'm having trouble connecting. Please try again.", 'assistant');
    }
  }
};
 
// ─── HELPERS ──────────────────────────────────────────────
function showErr(form, msg) {
  const el = document.getElementById(form + 'Error');
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}
 
function clearErrors() {
  ['loginError', 'signupError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  });
}
 
function setBtnLoading(id, loading, text) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  if (!loading) { btn.classList.remove('loading'); btn.textContent = text; }
  else { btn.classList.add('loading'); btn.textContent = text; }
}
 
// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuthPanel();
  if (e.key === 'Enter') {
    const panel = document.getElementById('authPanel');
    if (!panel || !panel.classList.contains('open')) return;
    const loginVisible = document.getElementById('panelLogin')?.style.display !== 'none';
    if (loginVisible) handleLogin();
    else if (document.getElementById('panelSignup')?.style.display !== 'none') handleSignup();
  }
});
 
// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAuth();
  updateAuthUI();
