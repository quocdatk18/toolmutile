@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 TEST OBFUSCATED CODE
echo ========================================
echo.

REM Check if obfuscated files exist
echo 🔍 Checking obfuscated files...
set FOUND=0

if exist "core\license-manager.obfuscated.js" (
    echo ✅ license-manager.obfuscated.js found
    set FOUND=1
) else (
    echo ❌ license-manager.obfuscated.js not found
)

if exist "core\api-key-manager.obfuscated.js" (
    echo ✅ api-key-manager.obfuscated.js found
    set FOUND=1
) else (
    echo ❌ api-key-manager.obfuscated.js not found
)

if %FOUND%==0 (
    echo.
    echo ⚠️  No obfuscated files found!
    echo 💡 Run OBFUSCATE_ALL_CODE.bat first
    pause
    exit /b 1
)

echo.
echo 📋 Creating test environment...

REM Backup current files
if not exist "test-backup" mkdir test-backup
copy /Y "core\*.js" "test-backup\" >nul 2>&1
echo ✅ Current files backed up to test-backup

REM Replace with obfuscated versions
echo.
echo 🔄 Replacing with obfuscated versions...
if exist "core\license-manager.obfuscated.js" copy /Y "core\license-manager.obfuscated.js" "core\license-manager.js" >nul
if exist "core\api-key-manager.obfuscated.js" copy /Y "core\api-key-manager.obfuscated.js" "core\api-key-manager.js" >nul
if exist "core\hidemium-api.obfuscated.js" copy /Y "core\hidemium-api.obfuscated.js" "core\hidemium-api.js" >nul
if exist "core\profile-manager.obfuscated.js" copy /Y "core\profile-manager.obfuscated.js" "core\profile-manager.js" >nul
if exist "core\sim-api-manager.obfuscated.js" copy /Y "core\sim-api-manager.obfuscated.js" "core\sim-api-manager.js" >nul
if exist "dashboard\server.obfuscated.js" copy /Y "dashboard\server.obfuscated.js" "dashboard\server.js" >nul
echo ✅ Files replaced

echo.
echo ========================================
echo 🚀 STARTING TEST SERVER...
echo ========================================
echo.
echo 📝 Testing obfuscated code...
echo 🌐 Server will start on http://localhost:3000
echo.
echo ⚠️  Press Ctrl+C to stop server
echo.
echo 🧪 Test checklist:
echo    1. Dashboard loads correctly
echo    2. License system works
echo    3. API connections work
echo    4. No console errors
echo.
echo If everything works, the obfuscation is successful!
echo.
pause

REM Start server
node dashboard/server.js

REM After server stops, restore original files
echo.
echo 🔄 Restoring original files...
copy /Y "test-backup\*.js" "core\" >nul 2>&1
rmdir /s /q "test-backup" 2>nul
echo ✅ Original files restored

echo.
echo ========================================
echo ✅ TEST COMPLETED
echo ========================================
echo.
pause
