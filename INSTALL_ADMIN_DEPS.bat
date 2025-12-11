@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 📦 INSTALLING ADMIN DEPENDENCIES
echo ========================================
echo.
echo Installing archiver package...
call npm install archiver
echo.
if errorlevel 1 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)
echo ✅ Installation completed!
echo.
echo 🎉 Admin UI is ready!
echo.
echo To use:
echo   1. Restart dashboard: npm run dashboard
echo   2. Open: http://localhost:3000/admin
echo.
pause
