@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 TEST CUSTOMER PACKAGE
echo ========================================
echo.

cd customer-packages\dat

echo 📦 Checking package structure...
echo.

if not exist "package.json" (
    echo ❌ package.json not found!
    pause
    exit /b 1
)

if not exist "dashboard\server.js" (
    echo ❌ dashboard\server.js not found!
    pause
    exit /b 1
)

echo ✅ Package structure OK
echo.

echo 📥 Installing dependencies...
echo.
call npm install

if errorlevel 1 (
    echo.
    echo ❌ npm install failed!
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed
echo.

echo 🚀 Starting server...
echo.
call npm run dashboard

pause
