@echo off
echo ========================================
echo   Hidemium Multi-Tool Dashboard
echo ========================================
echo.
echo Starting dashboard server...
echo.
echo Dashboard will open at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

cd /d "%~dp0"
node dashboard/server.js

pause
