@echo off
cd /d "%~dp0"
title Pixel Refiner
where npm >nul 2>nul
if errorlevel 1 (
  echo(
  echo Node.js was not found. Please install the LTS version from https://nodejs.org/
  echo then double-click this file again.
  echo(
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies for the first time. This can take a minute...
  call npm install
  if errorlevel 1 (
    echo(
    echo npm install failed. Check the error above, then run this file again.
    pause
    exit /b 1
  )
)
echo(
echo Starting Pixel Refiner. Your browser will open at http://localhost:5173
echo Keep this window open while using the app. Close it to stop the server.
echo(
call npm run dev
pause
