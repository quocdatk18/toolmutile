@echo off
echo ========================================
echo 🔒 ADVANCED OBFUSCATION SYSTEM
echo ========================================
echo.

echo 📋 This will obfuscate the ENTIRE project with:
echo    ✅ HIGH security for critical files
echo    ✅ MEDIUM security for regular files  
echo    ⚪ Whitelist protection for essential files
echo.

echo ⚠️  WARNING: This process may take several minutes
echo.

set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Obfuscation cancelled
    pause
    exit /b 1
)

echo.
echo 🚀 Starting advanced obfuscation...
echo.

REM Install dependencies if needed
if not exist node_modules\javascript-obfuscator (
    echo 📦 Installing javascript-obfuscator...
    npm install javascript-obfuscator minimatch glob
    echo.
)

REM Run advanced obfuscation
node tools/advanced-obfuscate.js

echo.
echo ========================================
echo 🎉 ADVANCED OBFUSCATION COMPLETED
echo ========================================
echo.

echo 📁 Check the 'obfuscated-project' folder
echo 🔧 Use this folder to create customer packages
echo.

pause