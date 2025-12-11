@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 BUILD TEST PACKAGE (AUTO)
echo ========================================
echo.

REM Set test customer info
set CUSTOMER_NAME=test_customer
set LICENSE_TYPE=1
set DAYS=7
set BIND_MACHINE=y

echo 📋 Test Package Info:
echo    Customer: %CUSTOMER_NAME%
echo    License: Trial 7 days
echo    Machine Binding: Yes
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

echo ========================================
echo 🔧 Building test package...
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
del /Q "%OUTPUT_DIR%\.license" 2>nul
del /Q "%OUTPUT_DIR%\BUILD_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\CREATE_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\OBFUSCATE_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\TEST_*.bat" 2>nul
del /Q "%OUTPUT_DIR%\exclude-list.txt" 2>nul
rmdir /S /Q "%OUTPUT_DIR%\.git" 2>nul
del /Q "%OUTPUT_DIR%\.gitignore" 2>nul
del /Q "%OUTPUT_DIR%\*.md" 2>nul

REM Generate license key
echo 🔑 Generating license key...
node tools/generate-license.js --days %DAYS% --bind --username "%CUSTOMER_NAME%"

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
echo HIDEMIUM MULTI-TOOL - TEST VERSION
echo ========================================
echo.
echo Customer: %CUSTOMER_NAME%
echo License: Trial 7 days
echo.
echo INSTALLATION:
echo   1. Install Node.js ^(if not installed^)
echo   2. Run: npm install
echo   3. Run: npm run dashboard
echo.
echo ACTIVATION:
echo   1. Open dashboard: http://localhost:3000
echo   2. Click "License" button in header
echo   3. Paste your license key from LICENSE_KEY.txt
echo   4. Click "Activate License"
echo.
echo Your license key is in: LICENSE_KEY.txt
echo.
echo This is a TEST package for 7 days trial.
echo.
echo ========================================
) > "%OUTPUT_DIR%\README.txt"

echo ✅ README created

echo.
echo ========================================
echo ✅ TEST PACKAGE COMPLETED!
echo ========================================
echo.
echo 📦 Package location: %OUTPUT_DIR%
echo 🔑 License key: See LICENSE_KEY.txt in package
echo 🔐 Secret key: %SECRET_KEY%
echo 🔒 Code: OBFUSCATED (protected)
echo.
echo ⚠️  IMPORTANT: SAVE THIS SECRET KEY!
echo.
echo ┌────────────────────────────────────────────┐
echo │  SECRET KEY (SAVE THIS!)                   │
echo │  %SECRET_KEY%                              │
echo └────────────────────────────────────────────┘
echo.
echo 📝 Save to file...
(
echo TEST PACKAGE INFO
echo =================
echo Customer: %CUSTOMER_NAME%
echo Secret Key: %SECRET_KEY%
echo License Type: Trial 7 days
echo Created: %date% %time%
echo Machine Binding: Yes
echo Status: Test Package
) > "customer-packages\%CUSTOMER_NAME%_SECRET_KEY.txt"
echo ✅ Secret key saved to: customer-packages\%CUSTOMER_NAME%_SECRET_KEY.txt
echo.
echo NEXT STEPS:
echo   1. Test the package in: %OUTPUT_DIR%
echo   2. Run: cd %OUTPUT_DIR%
echo   3. Run: npm install
echo   4. Run: npm run dashboard
echo   5. Activate with license key from LICENSE_KEY.txt
echo.
pause
