@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
node test-license-validation.js
echo.
pause
