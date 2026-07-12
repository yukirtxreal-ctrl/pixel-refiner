@echo off
cd /d "%~dp0"
title Pixel Refiner (prebuilt)
if not exist "%~dp0dist\index.html" (
  echo No build found. Run start-app.bat once, or "npm run build", then try again.
  pause
  exit /b 1
)
cd /d "%~dp0dist"
where npx >nul 2>nul && (
  echo Serving prebuilt app at http://localhost:8000 ...
  start "" http://localhost:8000
  call npx --yes serve -l 8000 .
  goto :eof
)
python -c "1" >nul 2>nul && (
  echo Serving prebuilt app at http://localhost:8000 ...
  start "" http://localhost:8000
  python -m http.server 8000
  goto :eof
)
echo Neither Node nor Python found. Install Node.js from https://nodejs.org/ and use start-app.bat instead.
pause
