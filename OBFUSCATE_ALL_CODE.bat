@echo off
chcp 65001 >nul
echo ========================================
echo 🔒 OBFUSCATE ALL CRITICAL CODE
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

REM Create backup folder
echo 📋 Creating backups...
if not exist "backups" mkdir backups
if not exist "backups\core" mkdir backups\core
if not exist "backups\dashboard" mkdir backups\dashboard

REM Backup all files
copy /Y "core\*.js" "backups\core\" >nul 2>&1
copy /Y "dashboard\server.js" "backups\dashboard\" >nul 2>&1
echo ✅ Backups created in backups folder
echo.

REM Run obfuscation
echo 🔒 Obfuscating all critical files...
echo.
node tools/obfuscate-all.js
if errorlevel 1 (
    echo ❌ Obfuscation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ OBFUSCATION COMPLETED!
echo ========================================
echo.
echo 📁 Obfuscated files created with .obfuscated.js extension
echo 📁 Original files backed up in backups folder
echo.
echo 🔧 Next steps:
echo    1. Test the obfuscated versions
echo    2. Use BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat to create customer package
echo    3. Original files are safe in backups folder
echo.
pause
