@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 RUNNING TEST BUILD
echo ========================================
echo.
echo This will create a test package with:
echo   - Customer: test_customer
echo   - License: Trial 7 days  
echo   - Machine Binding: Yes
echo.
echo Press any key to continue...
pause >nul
echo.

REM Create input file for automated build
(
echo test_customer
echo 1
echo y
) > temp_input.txt

REM Run build with automated input
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat < temp_input.txt

REM Clean up
del temp_input.txt 2>nul

echo.
echo ========================================
echo ✅ TEST BUILD COMPLETED!
echo ========================================
echo.
echo Check: customer-packages\test_customer\
echo.
pause
