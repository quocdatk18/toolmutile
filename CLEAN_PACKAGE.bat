@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls

echo ========================================
echo 🧹 CLEAN SENSITIVE DATA FROM PACKAGE
echo ========================================
echo.

set /p PACKAGE_NAME="Enter package name (e.g., test_final): "

if "%PACKAGE_NAME%"=="" (
    echo ❌ Package name is required!
    pause
    exit /b 1
)

set PACKAGE_PATH=customer-packages\%PACKAGE_NAME%

if not exist "%PACKAGE_PATH%" (
    echo ❌ Package not found: %PACKAGE_PATH%
    pause
    exit /b 1
)

echo.
echo 🧹 Cleaning package: %PACKAGE_PATH%
echo.

node clean-sensitive-data.js "%PACKAGE_PATH%"

echo.
echo ========================================
echo ✅ DONE!
echo ========================================
echo.
echo Package is now clean and ready to send to customer!
echo.
pause
