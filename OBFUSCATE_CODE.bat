@echo off
chcp 65001 >nul
echo ========================================
echo 🔒 OBFUSCATE CODE FOR PRODUCTION
echo ========================================
echo.

REM Check if javascript-obfuscator is installed
echo 🔍 Checking dependencies...
call npm list javascript-obfuscator >nul 2>&1
if errorlevel 1 (
    echo ⚠️  javascript-obfuscator not found!
    echo 📥 Installing...
    call npm install javascript-obfuscator
    if errorlevel 1 (
        echo ❌ Failed to install javascript-obfuscator
        pause
        exit /b 1
    )
)
echo ✅ Dependencies OK
echo.

REM Backup original file
echo 📋 Creating backup...
if not exist "backups" mkdir backups
copy /Y "core\license-manager.js" "backups\license-manager.js.backup" >nul
echo ✅ Backup created: backups\license-manager.js.backup
echo.

REM Run obfuscation
echo 🔒 Obfuscating license-manager.js...
node tools/obfuscate-license.js
if errorlevel 1 (
    echo ❌ Obfuscation failed!
    pause
    exit /b 1
)
echo.

REM Show file sizes
echo 📊 File comparison:
for %%A in ("core\license-manager.js") do echo    Original: %%~zA bytes
for %%A in ("core\license-manager.obfuscated.js") do echo    Obfuscated: %%~zA bytes
echo.

echo ========================================
echo ✅ OBFUSCATION COMPLETED!
echo ========================================
echo.
echo 📁 Files created:
echo    - core\license-manager.obfuscated.js (obfuscated version)
echo    - backups\license-manager.js.backup (original backup)
echo.
echo 🔧 Next steps:
echo    1. Test the obfuscated version
echo    2. If OK, use BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
echo    3. Original file is backed up in backups folder
echo.
pause
