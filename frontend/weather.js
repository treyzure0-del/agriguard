/* =========================================================
   AgriGuard AI — Weather Module
   Uses Open-Meteo API (free, no key needed)
   ========================================================= */
 
'use strict';
 
// ─── STATE ────────────────────────────────────────────────
let currentWeatherCity = 'Kampala';
let currentWeatherLat = 0.3136;
let currentWeatherLon = 32.5811;
let weatherDataCache = null;
 
// ─── WEATHER CODE MAPS ────────────────────────────────────
const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};
 
const WMO_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm'
};
 
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 
// ─── MAIN LOAD FUNCTION ───────────────────────────────────
async function loadWeather() {
  showWeatherLoading(true);
 
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${currentWeatherLat}&longitude=${currentWeatherLon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,precipitation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=7`;
 
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error: ' + res.status);
    const data = await res.json();
    weatherDataCache = data;
    showWeatherLoading(false);
    renderCurrentWeather(data);
    renderForecast(data);
    renderHourly(data);
    renderFarmingConditions(data);
    updateHomeWeatherWidget(data);
  } catch (err) {
    console.error('[weather] Load failed:', err.message);
    showWeatherLoading(false);
    showWeatherError('Could not load weather data. Please check your connection.');
  }
}
 
// ─── SHOW/HIDE LOADING ────────────────────────────────────
function showWeatherLoading(loading) {
  const loadEl = document.getElementById('weatherLoading');
  const errEl = document.getElementById('weatherError');
  const mainCard = document.getElementById('weatherMainCard');
  const forecastSec = document.getElementById('weatherForecastSection');
  const hourlySec = document.getElementById('weatherHourlySection');
  const farmingSec = document.getElementById('weatherFarmingSection');
 
  if (loading) {
    if (loadEl) loadEl.style.display = 'flex';
    if (errEl) errEl.style.display = 'none';
    if (mainCard) mainCard.style.display = 'none';
    if (forecastSec) forecastSec.style.display = 'none';
    if (hourlySec) hourlySec.style.display = 'none';
    if (farmingSec) farmingSec.style.display = 'none';
  } else {
    if (loadEl) loadEl.style.display = 'none';
  }
}
 
function showWeatherError(msg) {
  const errEl = document.getElementById('weatherError');
  const msgEl = document.getElementById('weatherErrorMsg');
  if (errEl) errEl.style.display = 'block';
  if (msgEl) msgEl.textContent = msg;
}
 
// ─── CURRENT WEATHER ──────────────────────────────────────
function renderCurrentWeather(data) {
  const c = data.current;
  const code = c.weather_code;
  const icon = WMO_ICONS[code] || '🌤️';
  const desc = WMO_DESCRIPTIONS[code] || 'Unknown';
  const temp = Math.round(c.temperature_2m);
  const humidity = c.relative_humidity_2m;
  const wind = Math.round(c.wind_speed_10m);
  const rain = c.precipitation || 0;
  const uv = c.uv_index || 0;
 
  // Update elements
  set('weatherBigIcon', icon);
  set('weatherBigTemp', temp + '°C');
  set('weatherBigDesc', desc);
  set('weatherBigCity', currentWeatherCity);
  set('wHumidity', humidity + '%');
  set('wWind', wind + ' km/h');
  set('wRain', rain.toFixed(1) + ' mm');
  set('wUV', getUVLabel(uv));
 
  // Farming advice
  const advice = getFarmingAdvice(temp, humidity, rain, wind, code);
  set('wAdviceIcon', advice.icon);
  set('wAdviceTitle', advice.title);
  set('wAdviceText', advice.text);
 
  const mainCard = document.getElementById('weatherMainCard');
  if (mainCard) mainCard.style.display = 'block';
}
 
// ─── 7-DAY FORECAST ───────────────────────────────────────
function renderForecast(data) {
  const grid = document.getElementById('weatherForecastGrid');
  if (!grid) return;
  grid.innerHTML = '';
 
  const today = new Date().getDay();
 
  data.daily.time.forEach((dateStr, i) => {
    const date = new Date(dateStr);
    const dayName = i === 0 ? 'Today' : DAYS[date.getDay()];
    const code = data.daily.weather_code[i];
    const icon = WMO_ICONS[code] || '🌤️';
    const high = Math.round(data.daily.temperature_2m_max[i]);
    const low = Math.round(data.daily.temperature_2m_min[i]);
    const rainProb = data.daily.precipitation_probability_max[i] || 0;
    const rainSum = (data.daily.precipitation_sum[i] || 0).toFixed(1);
 
    const card = document.createElement('div');
    card.className = 'forecast-day-card' + (i === 0 ? ' today' : '');
    card.innerHTML = `
      <div class="forecast-day-name">${dayName}</div>
      <span class="forecast-icon">${icon}</span>
      <div class="forecast-high">${high}°</div>
      <div class="forecast-low">${low}°</div>
      ${rainProb > 20 ? `<div class="forecast-rain">🌧️ ${rainProb}%</div>` : '<div class="forecast-rain" style="opacity:0">-</div>'}
    `;
    grid.appendChild(card);
  });
 
  const forecastSec = document.getElementById('weatherForecastSection');
  if (forecastSec) forecastSec.style.display = 'block';
}
 
// ─── HOURLY FORECAST ──────────────────────────────────────
function renderHourly(data) {
  const grid = document.getElementById('weatherHourlyGrid');
  if (!grid) return;
  grid.innerHTML = '';
 
  const now = new Date();
  const currentHour = now.getHours();
 
  // Show next 24 hours starting from current hour
  let startIdx = 0;
  const times = data.hourly.time;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]);
    if (t.getDate() === now.getDate() && t.getHours() >= currentHour) {
      startIdx = i;
      break;
    }
  }
 
  const endIdx = Math.min(startIdx + 24, times.length);
  for (let i = startIdx; i < endIdx; i++) {
    const t = new Date(times[i]);
    const hour = t.getHours();
    const timeLabel = hour === 0 ? '12 AM' : hour < 12 ? hour + ' AM' : hour === 12 ? '12 PM' : (hour - 12) + ' PM';
    const code = data.hourly.weather_code[i];
    const icon = WMO_ICONS[code] || '🌤️';
    const temp = Math.round(data.hourly.temperature_2m[i]);
    const rainProb = data.hourly.precipitation_probability[i] || 0;
    const isCurrent = i === startIdx;
 
    const card = document.createElement('div');
    card.className = 'hourly-card' + (isCurrent ? ' current-hour' : '');
    card.innerHTML = `
      <div class="hourly-time">${isCurrent ? 'Now' : timeLabel}</div>
      <span class="hourly-icon">${icon}</span>
      <div class="hourly-temp">${temp}°</div>
      ${rainProb > 20 ? `<div class="hourly-rain">🌧️${rainProb}%</div>` : '<div class="hourly-rain" style="opacity:0">-</div>'}
    `;
    grid.appendChild(card);
  }
 
  const hourlySec = document.getElementById('weatherHourlySection');
  if (hourlySec) hourlySec.style.display = 'block';
}
 
// ─── FARMING CONDITIONS ───────────────────────────────────
function renderFarmingConditions(data) {
  const grid = document.getElementById('weatherFarmingGrid');
  if (!grid) return;
  grid.innerHTML = '';
 
  // Calculate weekly averages
  const daily = data.daily;
  const avgHigh = avg(daily.temperature_2m_max);
  const avgLow = avg(daily.temperature_2m_min);
  const totalRain = daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0);
  const maxRainProb = Math.max(...daily.precipitation_probability_max.map(v => v || 0));
  const avgUV = avg(daily.uv_index_max);
  const hasThunder = daily.weather_code.some(c => c >= 95);
 
  const conditions = [
    {
      icon: '🌱',
      title: 'Planting Conditions',
      ...getPlantingCondition(avgHigh, totalRain, maxRainProb)
    },
    {
      icon: '💧',
      title: 'Irrigation Needs',
      ...getIrrigationCondition(totalRain, avgHigh)
    },
    {
      icon: '🚜',
      title: 'Field Work',
      ...getFieldWorkCondition(totalRain, maxRainProb, hasThunder)
    },
    {
      icon: '🌾',
      title: 'Harvesting',
      ...getHarvestCondition(totalRain, maxRainProb, avgHigh)
    },
    {
      icon: '🌿',
      title: 'Spraying / Pesticides',
      ...getSprayingCondition(data.current.wind_speed_10m, maxRainProb)
    },
    {
      icon: '☀️',
      title: 'UV / Sun Exposure',
      ...getUVCondition(avgUV)
    }
  ];
 
  conditions.forEach(c => {
    const card = document.createElement('div');
    card.className = 'farming-condition-card';
    card.innerHTML = `
      <div class="farming-condition-header">
        <span class="farming-condition-icon">${c.icon}</span>
        <span class="farming-condition-title">${c.title}</span>
      </div>
      <div class="farming-condition-status ${c.status}">${c.label}</div>
      <div class="farming-condition-desc">${c.desc}</div>
    `;
    grid.appendChild(card);
  });
 
  const farmingSec = document.getElementById('weatherFarmingSection');
  if (farmingSec) farmingSec.style.display = 'block';
}
 
// ─── HOME WIDGET UPDATE ───────────────────────────────────
function updateHomeWeatherWidget(data) {
  const c = data.current;
  const code = c.weather_code;
  const icon = WMO_ICONS[code] || '🌤️';
  const temp = Math.round(c.temperature_2m);
  const humidity = c.relative_humidity_2m;
  const wind = Math.round(c.wind_speed_10m);
  const rain = c.precipitation || 0;
 
  const advice = getFarmingAdvice(temp, humidity, rain, wind, code);
 
  set('homeWeatherIcon', icon);
  set('homeWeatherTemp', temp + '°C');
  set('homeWeatherCity', currentWeatherCity + ', East Africa');
  set('homeWeatherHumidity', humidity + '%');
  set('homeWeatherWind', wind + ' km/h');
  set('homeWeatherRain', rain.toFixed(1) + ' mm');
  set('homeWeatherAdvice', advice.icon + ' ' + advice.title);
 
  const loading = document.getElementById('homeWeatherLoading');
  const content = document.getElementById('homeWeatherContent');
  if (loading) loading.style.display = 'none';
  if (content) content.style.display = 'flex';
}
 
// ─── CITY SELECTION ───────────────────────────────────────
function selectWeatherCity(btn, name, lat, lon) {
  document.querySelectorAll('.weather-city-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentWeatherCity = name;
  currentWeatherLat = lat;
  currentWeatherLon = lon;
  loadWeather();
}
 
async function searchWeatherCity() {
  const input = document.getElementById('weatherSearchInput');
  const query = input?.value?.trim();
  if (!query) return;
 
  // Use Open-Meteo geocoding API
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const data = await res.json();
 
    if (!data.results || data.results.length === 0) {
      showError('City not found. Try a larger nearby city.');
      return;
    }
 
    const result = data.results[0];
    currentWeatherCity = result.name + (result.country ? ', ' + result.country : '');
    currentWeatherLat = result.latitude;
    currentWeatherLon = result.longitude;
 
    document.querySelectorAll('.weather-city-btn').forEach(b => b.classList.remove('active'));
    if (input) input.value = '';
 
    loadWeather();
  } catch (err) {
    showError('Could not search for that city. Please try again.');
  }
}
 
// ─── FARMING ADVICE LOGIC ─────────────────────────────────
function getFarmingAdvice(temp, humidity, rain, wind, code) {
  if (code >= 95) return {
    icon: '⚠️',
    title: 'Thunderstorm Warning',
    text: 'Stay indoors. Do not work in fields. Secure equipment and cover vulnerable crops.'
  };
  if (code >= 61 && code <= 67) return {
    icon: '🌧️',
    title: 'Heavy Rain — Delay Field Work',
    text: 'Postpone planting, harvesting, and spraying. Check drainage to prevent waterlogging.'
  };
  if (rain > 5) return {
    icon: '💧',
    title: 'Rainfall Today — Good for Crops',
    text: 'Natural irrigation occurring. Delay artificial irrigation. Watch for soil erosion on slopes.'
  };
  if (temp > 35) return {
    icon: '🌡️',
    title: 'High Heat Alert',
    text: 'Irrigate early morning or evening. Crops may show heat stress. Provide shade for seedlings.'
  };
  if (temp < 10) return {
    icon: '❄️',
    title: 'Cool Temperatures',
    text: 'Slow crop growth expected. Good for some cool-season crops. Monitor for frost in highland areas.'
  };
  if (humidity > 85) return {
    icon: '🍄',
    title: 'High Humidity — Disease Risk',
    text: 'Conditions favour fungal diseases. Scout crops for early blight, mildew. Apply preventive fungicide.'
  };
  if (wind > 30) return {
    icon: '💨',
    title: 'Strong Winds',
    text: 'Avoid spraying pesticides or fertilizers. Support tall crops. Risk of lodging in maize.'
  };
  if (code <= 1 && temp >= 20 && temp <= 30) return {
    icon: '✅',
    title: 'Excellent Farming Conditions',
    text: 'Clear skies and good temperatures. Ideal for field work, planting, spraying, and harvesting.'
  };
  return {
    icon: '🌱',
    title: 'Moderate Conditions',
    text: 'Suitable for most farming activities. Monitor soil moisture and crop health as usual.'
  };
}
 
function getPlantingCondition(avgHigh, totalRain, maxRainProb) {
  if (totalRain > 5 && totalRain < 60 && avgHigh > 18 && avgHigh < 35) {
    return { status: 'good', label: '✓ Good', desc: 'Soil moisture and temperatures are suitable for planting this week.' };
  }
  if (totalRain > 60 || maxRainProb > 80) {
    return { status: 'poor', label: '✗ Poor', desc: 'Too much rain expected. Delay planting to avoid waterlogging and seedling rot.' };
  }
  if (totalRain < 2 && avgHigh > 32) {
    return { status: 'fair', label: '~ Fair', desc: 'Dry and hot conditions. Plant only if irrigation is available.' };
  }
  return { status: 'fair', label: '~ Fair', desc: 'Conditions are acceptable but not ideal. Monitor moisture levels after planting.' };
}
 
function getIrrigationCondition(totalRain, avgHigh) {
  if (totalRain > 40) return { status: 'good', label: '✓ Not Needed', desc: 'Sufficient rainfall expected this week. No irrigation required. Monitor for excess water.' };
  if (totalRain > 15) return { status: 'fair', label: '~ Light Needed', desc: 'Some rainfall but may not be enough for all crops. Supplement irrigation for vegetables.' };
  return { status: 'poor', label: '! Required', desc: 'Low rainfall expected. Irrigate regularly, preferably early morning or evening to reduce evaporation.' };
}
 
function getFieldWorkCondition(totalRain, maxRainProb, hasThunder) {
  if (hasThunder) return { status: 'poor', label: '✗ Dangerous', desc: 'Thunderstorms forecast. Do not operate machinery or work in open fields.' };
  if (maxRainProb > 70) return { status: 'fair', label: '~ Limited', desc: 'High chance of rain. Plan field work for mornings and have equipment ready to shelter.' };
  if (totalRain < 20 && maxRainProb < 40) return { status: 'good', label: '✓ Good', desc: 'Suitable conditions for plowing, weeding, and general field operations.' };
  return { status: 'fair', label: '~ Fair', desc: 'Variable conditions. Check daily forecasts before planning heavy machinery work.' };
}
 
function getHarvestCondition(totalRain, maxRainProb, avgHigh) {
  if (maxRainProb < 30 && avgHigh > 22) return { status: 'good', label: '✓ Excellent', desc: 'Dry and warm — ideal for harvesting and drying grain. Take advantage of this window.' };
  if (maxRainProb > 60 || totalRain > 30) return { status: 'poor', label: '✗ Poor', desc: 'Wet conditions. Delay harvesting to prevent grain spoilage, mold, and aflatoxin risk.' };
  return { status: 'fair', label: '~ Fair', desc: 'Acceptable for harvesting. Dry harvested produce quickly under available sunshine.' };
}
 
function getSprayingCondition(windSpeed, rainProb) {
  if (windSpeed > 25) return { status: 'poor', label: '✗ Too Windy', desc: 'Wind speed too high for spraying. Pesticides will drift and be ineffective or harm neighbouring crops.' };
  if (rainProb > 60) return { status: 'poor', label: '✗ Rain Expected', desc: 'Rain will wash off chemicals before they work. Wait for a dry spell of at least 4-6 hours after spraying.' };
  if (windSpeed < 15 && rainProb < 30) return { status: 'good', label: '✓ Good', desc: 'Low wind and dry conditions are ideal for pesticide and fertilizer application.' };
  return { status: 'fair', label: '~ Fair', desc: 'Spray in early morning when winds are calm. Monitor forecast before application.' };
}
 
function getUVCondition(avgUV) {
  if (avgUV > 10) return { status: 'poor', label: '! Extreme UV', desc: 'Extreme UV index. Wear protective clothing, hat, and sunscreen when working outdoors.' };
  if (avgUV > 7) return { status: 'fair', label: '~ High UV', desc: 'High UV levels. Take breaks in shade, wear a hat, and stay hydrated during field work.' };
  return { status: 'good', label: '✓ Moderate', desc: 'UV levels are manageable. Standard precautions (hat, water) are sufficient for field work.' };
}
 
// ─── HELPERS ──────────────────────────────────────────────
function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
 
function avg(arr) {
  const valid = arr.filter(v => v != null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}
 
function getUVLabel(uv) {
  if (uv <= 2) return uv + ' Low';
  if (uv <= 5) return uv + ' Mod';
  if (uv <= 7) return uv + ' High';
  if (uv <= 10) return uv + ' V.High';
  return uv + ' Extreme';
}
 
// ─── INIT ─────────────────────────────────────────────────
// Load weather when page is shown
document.addEventListener('DOMContentLoaded', function() {
  // Load home widget immediately
  loadWeather();
});
 
// Hook into showPage to reload when weather page is opened
const _origShowPageWeather = typeof showPage === 'function' ? showPage : null;
if (_origShowPageWeather) {
  showPage = function(name) {
    _origShowPageWeather(name);
    if (name === 'weather' && !weatherDataCache) {
      loadWeather();
    }
  };
}
