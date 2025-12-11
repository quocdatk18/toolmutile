@echo off
chcp 65001 >nul
echo ========================================
echo 🔄 REBUILD CUSTOMER PACKAGE
echo ========================================
echo.

set /p CUSTOMER_NAME="Enter customer name to rebuild: "

if "%CUSTOMER_NAME%"=="" (
    echo ❌ Customer name required!
    pause
    exit /b 1
)

set PACKAGE_DIR=customer-packages\%CUSTOMER_NAME%

if not exist "%PACKAGE_DIR%" (
    echo ❌ Package not found: %PACKAGE_DIR%
    pause
    exit /b 1
)

echo.
echo 🗑️  Removing admin files from package...
echo.

REM Remove admin files
del /Q "%PACKAGE_DIR%\dashboard\admin.html" 2>nul
del /Q "%PACKAGE_DIR%\dashboard\admin-api.js" 2>nul

if exist "%PACKAGE_DIR%\dashboard\admin.html" (
    echo ❌ Failed to remove admin.html
) else (
    echo ✅ Removed admin.html
)

if exist "%PACKAGE_DIR%\dashboard\admin-api.js" (
    echo ❌ Failed to remove admin-api.js
) else (
    echo ✅ Removed admin-api.js
)

echo.
echo ========================================
echo ✅ REBUILD COMPLETED
echo ========================================
echo.
echo Package: %PACKAGE_DIR%
echo.
echo Admin features have been removed.
echo Customer can no longer access /admin page.
echo.
pause
