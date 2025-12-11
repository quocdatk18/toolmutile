@echo off
cd /d "%~dp0"
copy /Y dashboard\admin-api-fixed.js dashboard\admin-api.js
echo ✅ Replaced admin-api.js
pause
