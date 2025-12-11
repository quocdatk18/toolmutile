@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 📋 UPDATING UI IN TEST PACKAGE
echo ========================================
echo.

if not exist "customer-packages\test_final\dashboard" (
    echo ❌ Package test_final not found!
    echo 💡 Run: node build-test-final.js first
    pause
    exit /b 1
)

echo 📄 Copying updated license.html...
copy /Y "dashboard\license.html" "customer-packages\test_final\dashboard\license.html" >nul

if errorlevel 1 (
    echo ❌ Failed to copy file!
    pause
    exit /b 1
)

echo ✅ UI updated successfully!
echo.
echo 🌐 Refresh your browser to see changes!
echo    URL: http://localhost:3000/license.html
echo.
pause
