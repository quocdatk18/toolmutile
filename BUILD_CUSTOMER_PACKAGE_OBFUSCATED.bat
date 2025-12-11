@echo off
chcp 65001 >nul
echo ========================================
echo 📦 BUILD CUSTOMER PACKAGE (OBFUSCATED)
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

REM Get customer name
echo.
set /p CUSTOMER_NAME="Enter customer name (e.g., customer001): "
if "%CUSTOMER_NAME%"=="" (
    echo ❌ Customer name is required!
    pause
    exit /b 1
)

REM Get license type
echo.
echo Select license type:
echo   1. Trial 7 days
echo   2. Monthly (30 days)
echo   3. Quarterly (90 days)
echo   4. Lifetime
echo.
set /p LICENSE_TYPE="Enter choice (1-4): "

REM Set days based on choice
if "%LICENSE_TYPE%"=="1" set DAYS=7
if "%LICENSE_TYPE%"=="2" set DAYS=30
if "%LICENSE_TYPE%"=="3" set DAYS=90
if "%LICENSE_TYPE%"=="4" set DAYS=-1

REM Ask for machine binding
echo.
set /p BIND_MACHINE="Bind to machine? (y/n): "

echo.
echo ========================================
echo 🔧 Building package...
echo ========================================
echo.

REM Create output folder
set OUTPUT_DIR=customer-packages\%CUSTOMER_NAME%
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo ✅ Created folder: %OUTPUT_DIR%

REM Copy all files
echo 📋 Copying files...
xcopy /E /I /Y /Q . "%OUTPUT_DIR%" >nul 2>&1

REM Generate unique secret key
echo 🔐 Generating unique secret key...
set SECRET_KEY=SECRET_%CUSTOMER_NAME%_%RANDOM%_%RANDOM%

REM Update secret key in license-manager.js
echo 🔧 Updating secret key...
powershell -Command "(Get-Content '%OUTPUT_DIR%\core\license-manager.js') -replace 'HIDEMIUM_TOOL_SECRET_2024', '%SECRET_KEY%' | Set-Content '%OUTPUT_DIR%\core\license-manager.js'"

echo ✅ Secret key updated: %SECRET_KEY%

REM Obfuscate all critical files
echo 🔒 Obfuscating critical files...
node tools/obfuscate-all.js
if errorlevel 1 (
    echo ⚠️  Obfuscation failed, using original files
) else (
    echo ✅ Obfuscation completed
    REM Replace with obfuscated versions
    copy /Y core\license-manager.obfuscated.js "%OUTPUT_DIR%\core\license-manager.js" >nul 2>&1
    copy /Y core\api-key-manager.obfuscated.js "%OUTPUT_DIR%\core\api-key-manager.js" >nul 2>&1
    copy /Y core\hidemium-api.obfuscated.js "%OUTPUT_DIR%\core\hidemium-api.js" >nul 2>&1
    copy /Y core\profile-manager.obfuscated.js "%OUTPUT_DIR%\core\profile-manager.js" >nul 2>&1
    copy /Y core\sim-api-manager.obfuscated.js "%OUTPUT_DIR%\core\sim-api-manager.js" >nul 2>&1
    copy /Y dashboard\server.obfuscated.js "%OUTPUT_DIR%\dashboard\server.js" >nul 2>&1
    REM Clean up obfuscated files
    del core\*.obfuscated.js 2>nul
    del dashboard\*.obfuscated.js 2>nul
)

REM Remove sensitive files
echo 🗑️  Removing sensitive files...
del /Q "%OUTPUT_DIR%\tools\generate-license.js" 2>nul
del /Q "%OUTPUT_DIR%\tools\obfuscate-license.js" 2>nul
del /Q "%OUTPUT_DIR%\tools\obfuscate-all.js" 2>nul
del /Q "%OUTPUT_DIR%\tools\activate-license.js" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\license-records" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\customer-packages" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\backups" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\screenshots" 2>nul
del /Q "%OUTPUT_DIR%\.license" 2>nul
del /Q "%OUTPUT_DIR%\BUILD_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\CREATE_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\OBFUSCATE_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\TEST_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\GEN_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\CLEAN_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\UPDATE_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\*.md" 2>nul
del /Q "%OUTPUT_DIR%\exclude-list.txt" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\.git" 2>nul
del /Q "%OUTPUT_DIR%\.gitignore" 2>nul

REM Clean sensitive data from configs
echo 🧹 Cleaning sensitive data...
node clean-sensitive-data.js "%OUTPUT_DIR%"

REM Generate license key
echo 🔑 Generating license key...
if "%DAYS%"=="-1" (
    if /i "%BIND_MACHINE%"=="y" (
        node tools/generate-license.js --lifetime --bind --username "%CUSTOMER_NAME%"
    ) else (
        node tools/generate-license.js --lifetime --username "%CUSTOMER_NAME%"
    )
) else (
    if /i "%BIND_MACHINE%"=="y" (
        node tools/generate-license.js --days %DAYS% --bind --username "%CUSTOMER_NAME%"
    ) else (
        node tools/generate-license.js --days %DAYS% --username "%CUSTOMER_NAME%"
    )
)

REM Copy license record to package
echo 📄 Copying license info...
for /f "delims=" %%i in ('dir /b /od license-records\license-%CUSTOMER_NAME%-*.txt 2^>nul') do set LATEST_RECORD=%%i
if defined LATEST_RECORD (
    copy "license-records\%LATEST_RECORD%" "%OUTPUT_DIR%\LICENSE_KEY.txt" >nul
    echo ✅ License key saved to: %OUTPUT_DIR%\LICENSE_KEY.txt
)

REM Create README for customer
echo 📝 Creating customer README...
(
echo ========================================
echo HIDEMIUM MULTI-TOOL
echo ========================================
echo.
echo Customer: %CUSTOMER_NAME%
echo.
echo INSTALLATION:
echo   1. Install Node.js ^(if not installed^)
echo   2. Run: npm install
echo   3. Run: npm run dashboard
echo.
echo ACTIVATION:
echo   1. Open dashboard
echo   2. Click "🔐 License" button
echo   3. Paste your license key
echo   4. Click "Activate License"
echo.
echo Your license key is in: LICENSE_KEY.txt
echo.
echo SUPPORT:
echo   Contact seller if you have any issues
echo.
echo ========================================
) > "%OUTPUT_DIR%\README.txt"

echo ✅ README created

echo.
echo ========================================
echo ✅ PACKAGE COMPLETED (OBFUSCATED)!
echo ========================================
echo.
echo 📦 Package location: %OUTPUT_DIR%
echo 🔑 License key: See LICENSE_KEY.txt in package
echo 🔐 Secret key: %SECRET_KEY%
echo 🔒 Code: OBFUSCATED (protected)
echo.
echo NEXT STEPS:
echo   1. Zip the folder: %OUTPUT_DIR%
echo   2. Send ZIP file to customer
echo   3. Customer extracts and follows README.txt
echo.
echo ⚠️  IMPORTANT: Save the secret key for your records!
echo    Secret: %SECRET_KEY%
echo.
echo 🔒 The code has been obfuscated for security
echo    Customer cannot read or modify the license system
echo.
pause
