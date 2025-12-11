@echo off
echo ========================================
echo Creating Customer Package
echo ========================================
echo.

REM Create temp folder
if exist "customer-package" rmdir /s /q "customer-package"
mkdir "customer-package"

echo Copying files...

REM Copy all files except sensitive ones
xcopy /E /I /Y /EXCLUDE:exclude-list.txt . "customer-package"

REM Remove sensitive files
del /Q "customer-package\tools\generate-license.js" 2>nul
rmdir /S /Q "customer-package\license-records" 2>nul
del /Q "customer-package\.license" 2>nul

REM Remove this script itself
del /Q "customer-package\CREATE_CUSTOMER_PACKAGE.bat" 2>nul

echo.
echo ========================================
echo Package created in: customer-package\
echo ========================================
echo.
echo You can now zip and send this folder to customer
echo.
pause
