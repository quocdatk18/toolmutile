@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
node gen-license-simple.js
echo.
echo ========================================
echo Press any key to close...
echo ========================================
pause >nul
