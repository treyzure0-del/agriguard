@echo off
echo ========================================
echo    AgriGuard AI - First Time Setup
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Please download and install it from https://nodejs.org
  echo Choose the LTS version. Then run this script again.
  pause
  exit /b
)
echo Node.js found.

REM Install dependencies
echo Installing backend dependencies...
cd backend
npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  echo Try running: npm install --build-from-source better-sqlite3
  pause
  exit /b
)
cd ..

REM Create .env if not exists
if not exist backend\.env (
  copy backend\.env.example backend\.env
  echo.
  echo IMPORTANT: Open backend\.env in Notepad and add your API key.
  echo Get a FREE key from: https://aistudio.google.com
  echo.
)

echo.
echo ========================================
echo Setup complete! Now:
echo 1. Open backend\.env in Notepad
echo 2. Paste your Gemini API key
echo 3. Double-click start.bat to launch
echo ========================================
pause
