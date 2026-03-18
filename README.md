# AgriGuard AI — Setup Guide

## What This App Does

AgriGuard AI is a smart crop protection platform built for East African smallholder farmers in Uganda, Kenya, Tanzania, Rwanda, and Ethiopia. It connects to a real AI model (Google Gemini, OpenAI, or DeepSeek) and provides:

- **🔬 AI Disease Scanner** — Upload or capture a crop leaf photo and get an instant diagnosis with confidence score, health rating, and a complete treatment plan
- **🤖 AI Farming Advisor** — Full conversation AI chat for any agricultural question (diseases, pests, fertilizers, irrigation, soil, post-harvest)
- **🐛 Pest Detection** — Identify Fall Armyworm, Desert Locust, Aphids, Whitefly, Stalk Borer, Thrips with economic impact data and control protocols
- **🗺️ Disease Outbreak Map** — Live Leaflet map of disease reports across East Africa seeded with 12 real locations
- **📊 Farm Dashboard** — Scan history, crop health trends, alerts, and Chart.js visualizations

The backend is Node.js + Express + SQLite (better-sqlite3). The frontend is a pure HTML/CSS/JS single-page app served directly by Express. No React, no build step — just run `node server.js` and open your browser.

---

## Prerequisites

- **Node.js v18 or higher** — Download from [https://nodejs.org](https://nodejs.org) (choose the LTS version)
- A free Google Gemini API key (instructions in Step 1 below)
- Windows 10+, macOS 12+, or Ubuntu 20.04+

To check if Node.js is already installed, open a terminal and run:
```
node --version
```
You should see something like `v20.11.0`. If you see an error, install Node.js first.

---

## STEP 1 — Get a FREE API Key (takes 2 minutes)

1. Open your browser and go to: [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with any Google account (Gmail works)
3. Click the blue **"Get API key"** button in the top left
4. Click **"Create API key in new project"**
5. Copy the key that appears — it starts with `AIza...` and is about 39 characters long
6. Keep this key ready — you will paste it in Step 4

> **Is it really free?** Yes. Google Gemini API has a free tier that allows 15 requests per minute and 1 million tokens per day at no cost. This is more than enough for personal or small-scale use.

---

## STEP 2 — Create the Project Folder

1. Create a new folder on your computer called `agriguard-ai`
2. Inside it, create two subfolders: `backend` and `frontend`
3. Inside `backend`, create a subfolder called `routes`
4. Copy all the provided files into their correct locations following this structure:

```
agriguard-ai/
├── setup.bat
├── setup.sh
├── start.bat
├── start.sh
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── database.js
│   ├── ai_service.js
│   └── routes/
│       ├── advisor.js
│       ├── scan.js
│       ├── reports.js
│       └── pest.js
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## STEP 3 — Run the Setup Script

The setup script installs all Node.js dependencies and creates your `.env` file automatically.

### On Windows:

Double-click `setup.bat`

You will see:
```
========================================
   AgriGuard AI - First Time Setup
========================================
Node.js found.
Installing backend dependencies...
(npm install output...)
========================================
Setup complete! Now:
1. Open backend\.env in Notepad
2. Paste your Gemini API key
3. Double-click start.bat to launch
========================================
```

If you see `ERROR: Node.js is not installed`, install Node.js from [nodejs.org](https://nodejs.org) first and run setup.bat again.

### On Mac or Linux:

Open Terminal, navigate to the project folder, then run:

```bash
chmod +x setup.sh
./setup.sh
```

You will see similar output confirming Node.js was found and dependencies installed.

---

## STEP 4 — Add Your API Key

1. Open the file `backend/.env` in any text editor
   - Windows: Right-click → Open with → Notepad
   - Mac: Open with TextEdit (make sure it's in plain text mode)
   - VS Code: `code backend/.env`

2. Find this line:
   ```
   GEMINI_API_KEY=paste_your_gemini_key_here
   ```

3. Replace `paste_your_gemini_key_here` with your actual key. Example:
   ```
   GEMINI_API_KEY=AIzaSyAbc123xyz456defGHI789jklMNO012pqr
   ```

4. Make sure this line is also set correctly:
   ```
   AI_PROVIDER=gemini
   ```

5. Save the file. **Do not add spaces around the `=` sign.**

> **Important:** The `.env` file must not have quotes around the key value. Correct: `GEMINI_API_KEY=AIzaXXX`. Wrong: `GEMINI_API_KEY="AIzaXXX"`.

---

## STEP 5 — Start the App

### On Windows:

Double-click `start.bat`

### On Mac or Linux:

```bash
chmod +x start.sh
./start.sh
```

### Or manually from the backend/ folder:

```bash
cd backend
node server.js
```

You will see this in the terminal when it starts successfully:

```
╔══════════════════════════════════════════╗
║        AgriGuard AI is running!          ║
╠══════════════════════════════════════════╣
║  URL:      http://localhost:3000          ║
║  Provider: gemini                         ║
╠══════════════════════════════════════════╣
║  Press Ctrl+C to stop                    ║
╚══════════════════════════════════════════╝

✅ AI Provider: gemini (key configured)
```

If you see the warning `⚠️ WARNING: GEMINI API key not configured`, go back to Step 4 and make sure your `.env` file was saved correctly.

---

## STEP 6 — Open in Browser

Go to: [http://localhost:3000](http://localhost:3000)

The app will load with the home page. The disease map and dashboard will already have 12 demo reports seeded across Uganda, Kenya, and Tanzania so you can explore the features immediately.

**To test the AI scanner:**
1. Click **Scan** in the navigation
2. Upload any photo of a plant leaf (even a healthy one)
3. Click **Analyze Crop**
4. Wait 3–5 seconds for the AI analysis to complete

**To test the AI chat:**
1. Click **Advisor** in the navigation
2. Type any farming question and press Enter

---

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `'node' is not recognized` | Install Node.js from [nodejs.org](https://nodejs.org) and restart your terminal |
| `Cannot find module 'express'` | Run `npm install` inside the `backend/` folder |
| `Cannot find module 'better-sqlite3'` | Run `npm install --build-from-source better-sqlite3` in `backend/` |
| `GEMINI_API_KEY not set` warning | Open `backend/.env` and check the key — no spaces, no quotes |
| `Port 3000 already in use` | Change `PORT=3001` in `backend/.env` and open `http://localhost:3001` |
| Camera not working | You must access the app at `http://localhost:3000` — not `file://`. Camera requires a secure origin |
| `better-sqlite3` build error on Windows | Install Visual Studio Build Tools or run: `npm install --build-from-source better-sqlite3` |
| AI returns empty response | Check your API key is correct and has no extra spaces or line breaks |
| `AI_PROVIDER not recognized` | Make sure the value in `.env` is exactly `gemini`, `openai`, or `deepseek` (lowercase) |
| Map not showing | The Leaflet map loads from a CDN — make sure you have internet access |
| `fetch failed` in browser console | Make sure the Node.js server is running in a terminal |

---

## Switching AI Providers

The app supports three AI providers. You only need one API key.

### Google Gemini (Recommended — FREE)

Best for beginners. Free tier handles up to 15 requests/minute.

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
```

Get key: [https://aistudio.google.com](https://aistudio.google.com) → Get API Key → Create API key in new project

### OpenAI GPT-4o (Best Quality — Paid)

Highest quality responses. Requires a paid account. Approximately $0.01–0.03 per scan.

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

Get key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

Add billing at: [https://platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)

### DeepSeek (Cheapest Paid Option)

Excellent quality at a fraction of OpenAI prices. $5 credit lasts for months of regular use. Note: image analysis (scan and pest features) automatically falls back to Gemini since DeepSeek has no vision API — so you need a Gemini key too if using DeepSeek.

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...   # needed for image scanning
```

Get key: [https://platform.deepseek.com](https://platform.deepseek.com)

---

## Project Structure

```
agriguard-ai/
│
├── setup.bat                  ← Windows one-click setup
├── setup.sh                   ← Mac/Linux one-click setup
├── start.bat                  ← Windows one-click start
├── start.sh                   ← Mac/Linux one-click start
├── README.md                  ← This file
│
├── backend/
│   ├── package.json           ← Node.js dependencies
│   ├── .env.example           ← Environment variable template
│   ├── .env                   ← Your actual config (created by setup)
│   ├── server.js              ← Express server entry point
│   ├── database.js            ← SQLite database module (better-sqlite3)
│   ├── ai_service.js          ← Gemini/OpenAI/DeepSeek AI routing
│   ├── agriguard.db           ← SQLite database (auto-created on first run)
│   ├── uploads/               ← Temp image uploads (auto-cleaned)
│   └── routes/
│       ├── advisor.js         ← POST /api/advisor — AI chat endpoint
│       ├── scan.js            ← POST /api/scan — crop disease scanning
│       ├── reports.js         ← GET /api/reports, POST /api/report
│       └── pest.js            ← POST /api/pest — pest detection
│
└── frontend/
    ├── index.html             ← Single-page app (all 6 pages)
    ├── style.css              ← Complete dark green design system
    └── app.js                 ← All frontend logic (navigation, API calls, map, chart)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/advisor` | Send chat messages, receive AI farming advice |
| `POST` | `/api/scan` | Upload crop image, receive disease diagnosis JSON |
| `POST` | `/api/pest` | Upload image, receive pest identification JSON |
| `GET` | `/api/reports` | Get all disease reports from database |
| `POST` | `/api/report` | Save a new disease report |
| `GET` | `/api/outbreak-check` | Check for outbreak near coordinates |
| `GET` | `/api/health` | Server health check |

### Database Tables

| Table | Description |
|-------|-------------|
| `disease_reports` | All crop scan results with location and health data |
| `health_logs` | Time-series crop health scores for trending |
| `pest_reports` | Pest detection results |

The database is auto-created at `backend/agriguard.db` on first run. It is seeded with 12 demo disease reports across Uganda, Kenya, and Tanzania so the map and dashboard are populated immediately.

---

## Development Tips

**Run with auto-restart on file changes:**
```bash
cd backend
npm install -g nodemon
nodemon server.js
```

**View the raw SQLite database:**
Install [DB Browser for SQLite](https://sqlitebrowser.org/) and open `backend/agriguard.db`

**Change the port:**
Edit `PORT=3001` in `backend/.env` — no code changes needed

**Reset the database:**
Delete `backend/agriguard.db` — it will be recreated with fresh demo data on next start

**Check what AI provider is active:**
Open `http://localhost:3000/api/health` in your browser — it shows the active provider and timestamp

---

## Support

If the AI chat or scan is not working, the most common causes are:

1. **Wrong API key** — Double-check `backend/.env` has the correct key with no spaces or extra characters
2. **Wrong provider** — Make sure `AI_PROVIDER=gemini` matches the key you added (e.g., don't set `AI_PROVIDER=openai` and add a Gemini key)
3. **Server not running** — Make sure you see the "AgriGuard AI is running" message in your terminal
4. **Billing issue** — For OpenAI and DeepSeek, make sure your account has credit

For Gemini specifically: if you get a 429 error, you have hit the free tier rate limit (15 requests/minute). Wait 60 seconds and try again.
