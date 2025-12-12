@echo off
echo ========================================
echo 🎯 OBFUSCATE CRITICAL FILES ONLY
echo ========================================
echo.

echo 📋 This will obfuscate only critical files:
echo    🔒 core/license-manager.js
echo    🔒 core/api-key-manager.js  
echo    🔒 core/hidemium-api.js
echo    🔒 core/profile-manager.js
echo    🔒 core/sim-api-manager.js
echo    🔒 dashboard/server.js
echo    🔒 tools/*/auto-sequence.js
echo    🔒 tools/*/complete-automation.js
echo    🔒 tools/*/automation*.js
echo.

set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Obfuscation cancelled
    pause
    exit /b 1
)

echo.
echo 🚀 Starting critical files obfuscation...
echo.

REM Install dependencies if needed
if not exist node_modules\javascript-obfuscator (
    echo 📦 Installing javascript-obfuscator...
    npm install javascript-obfuscator minimatch glob
    echo.
)

REM Run obfuscation for critical files only
node tools/advanced-obfuscate.js --files "core/license-manager.js" "core/api-key-manager.js" "core/hidemium-api.js" "core/profile-manager.js" "core/sim-api-manager.js" "dashboard/server.js" "tools/*/auto-sequence.js" "tools/*/complete-automation.js" "tools/*/automation*.js" "tools/*/freelxb*.js"

echo.
echo ========================================
echo 🎉 CRITICAL FILES OBFUSCATED
echo ========================================
echo.

echo 📁 Check for *.obfuscated.js files
echo 🔧 Replace original files with obfuscated versions when ready
echo.

pause