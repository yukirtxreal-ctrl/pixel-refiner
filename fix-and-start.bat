@echo off
setlocal
title Pixel Refiner - repair and start
cd /d "%~dp0"
echo ============================================
echo  Pixel Refiner - one-time repair
echo ============================================
echo This removes the broken node_modules folder, reinstalls
echo dependencies for Windows, and starts the app.
echo.
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install the LTS version from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
if exist node_modules (
  echo [1/3] Removing broken node_modules... this can take a few minutes. Please wait.
  rd /s /q node_modules 2>nul
)
if exist node_modules rd /s /q node_modules 2>nul
if exist node_modules (
  echo.
  echo Could not fully remove node_modules. Pause OneDrive syncing, close other
  echo programs using this folder, then double-click this file again.
  pause
  exit /b 1
)
if exist "..\.pnpm-store" (
  echo Removing stray Linux package cache from the parent folder...
  rd /s /q "..\.pnpm-store" 2>nul
)
if exist "..\__tmpdir_test" rd /s /q "..\__tmpdir_test" 2>nul
echo [2/3] Installing dependencies with npm... this takes a minute or two.
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Check the error above, then run this file again.
  pause
  exit /b 1
)
echo.
echo [3/3] Starting Pixel Refiner. Your browser will open at http://localhost:5173
echo Keep this window open while using the app. Close it to stop the server.
echo.
call npm run dev
pause
