@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
cls
echo ========================================
echo    HIDEMIUM MULTI-TOOL
echo ========================================
echo.
echo Customer: Kat
echo License: 30 days
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed!
    echo.
    echo Please run INSTALL.bat first
    echo.
    echo Or press any key to install now...
    pause >nul
    echo.
    echo Installing dependencies...
    echo Please wait...
    echo.
    npm install --no-optional --loglevel=error
    if errorlevel 1 (
        echo.
        echo [ERROR] Installation failed!
        echo.
        echo Please try:
        echo    1. Run INSTALL.bat
        echo    2. Or run: npm install
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Installation completed!
    echo.
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo.
    echo Please run from tool root directory
    echo.
    pause
    exit /b 1
)

echo Starting dashboard...
echo Dashboard will open at: http://localhost:3000
echo.
echo License key: See LICENSE_KEY.txt
echo.
echo To stop server: Press Ctrl+C
echo.
echo ========================================
echo.

REM Start dashboard
npm run dashboard

REM If npm run dashboard fails
if errorlevel 1 (
    echo.
    echo [ERROR] Cannot start dashboard!
    echo.
    echo Try running manually:
    echo    node dashboard/server.js
    echo.
    pause
    exit /b 1
)
