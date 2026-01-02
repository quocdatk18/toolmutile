@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
cls
echo ========================================
echo    HIDEMIUM MULTI-TOOL - INSTALLATION
echo ========================================
echo.
echo Customer: LoCheoTele
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from:
    echo    https://nodejs.org
    echo.
    echo    Download LTS version (recommended)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js installed:
node --version
echo.

REM Check npm
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found!
    echo.
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
)

echo [OK] npm installed:
npm --version
echo.

REM Check if already installed
if exist "node_modules" (
    echo [WARNING] Dependencies already installed
    echo.
    set /p REINSTALL="Do you want to reinstall? (y/n): "
    if /i not "%REINSTALL%"=="y" (
        echo.
        echo [OK] Skipping installation
        echo.
        echo Run START.bat to start dashboard
        pause
        exit /b 0
    )
    echo.
    echo Removing old node_modules...
    rmdir /s /q node_modules 2>nul
    if exist "package-lock.json" (
        del /f /q package-lock.json 2>nul
    )
)

echo Installing dependencies...
echo This may take a few minutes...
echo.
echo Running: npm install
echo.

REM Run npm install
npm install --no-optional --loglevel=error

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    echo.
    echo Please try:
    echo    1. Check internet connection
    echo    2. Run CMD as Administrator
    echo    3. Run command: npm install
    echo    4. Contact support
    echo.
    echo Debug info:
    echo    - Node version: 
    node --version
    echo    - npm version: 
    npm --version
    echo    - Current dir: %CD%
    echo.
    pause
    exit /b 1
)

REM Verify installation
if not exist "node_modules" (
    echo.
    echo [ERROR] node_modules was not created!
    echo.
    echo Please run manually:
    echo    npm install
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    INSTALLATION COMPLETED!
echo ========================================
echo.
echo Next steps:
echo    1. Run START.bat to start dashboard
echo    2. Open browser: http://localhost:3000
echo    3. Activate license from LICENSE_KEY.txt
echo.
pause
