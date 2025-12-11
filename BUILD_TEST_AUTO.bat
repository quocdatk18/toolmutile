@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 BUILD TEST PACKAGE (AUTO INPUT)
echo ========================================
echo.
echo This will build a complete test package with:
echo   Customer: test_customer
echo   License: Trial 7 days
echo   Machine Binding: Yes
echo.
echo Press any key to start...
pause >nul
echo.

REM Delete old test package
if exist "customer-packages\test_customer" (
    echo 🗑️  Deleting old test package...
    rmdir /s /q "customer-packages\test_customer"
    echo ✅ Old package deleted
    echo.
)

REM Create input file
echo test_customer> temp_input.txt
echo 1>> temp_input.txt
echo y>> temp_input.txt

REM Run build with input
echo 🚀 Running BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat...
echo.
BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat < temp_input.txt

REM Clean up
del temp_input.txt 2>nul

echo.
echo ========================================
echo ✅ BUILD COMPLETED!
echo ========================================
echo.
echo Now you can test with: TEST_NGAY.bat
echo.
pause
