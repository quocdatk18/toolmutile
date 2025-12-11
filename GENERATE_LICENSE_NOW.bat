@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 🔑 GENERATING LICENSE KEY
echo ========================================
echo.
node generate-license-for-test.js
echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Copy the license key above and paste into dashboard!
echo.
pause
