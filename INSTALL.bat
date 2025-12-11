@echo off
echo ========================================
echo   Hidemium Multi-Tool - Installation
echo ========================================
echo.
echo Installing dependencies...
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Install dependencies
echo Installing npm packages...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Installation completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Double-click START_DASHBOARD.bat
    echo 2. Open http://localhost:3000
    echo 3. Start using the dashboard!
    echo.
) else (
    echo.
    echo [ERROR] Installation failed!
    echo Please check the error messages above.
    echo.
)

pause
