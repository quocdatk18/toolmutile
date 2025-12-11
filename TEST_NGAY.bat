@echo off
chcp 65001 >nul
cls
echo ========================================
echo 🧪 TEST PACKAGE NGAY
echo ========================================
echo.
echo Package test đã được tạo tại:
echo customer-packages\test_customer\
echo.
echo 🔐 SECRET KEY (Đã lưu):
echo SECRET_test_customer_16217_3768
echo.
echo 🔑 LICENSE KEY (Trong package):
echo Xem file LICENSE_KEY.txt
echo.
echo ========================================
echo 🚀 BẮT ĐẦU TEST
echo ========================================
echo.
echo Bước 1: Vào folder package...
cd customer-packages\test_customer
echo ✅ Đã vào folder: %CD%
echo.
echo Bước 2: Kiểm tra files...
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found - Package incomplete!
    echo.
    echo ⚠️  Package chưa đầy đủ files!
    echo 💡 Hãy chạy: BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat
    echo    Nhập: test_customer, 1, y
    echo.
    pause
    exit /b 1
)

if exist "LICENSE_KEY.txt" (
    echo ✅ LICENSE_KEY.txt found
) else (
    echo ❌ LICENSE_KEY.txt NOT found
)

if exist "README.txt" (
    echo ✅ README.txt found
) else (
    echo ❌ README.txt NOT found
)

echo.
echo Bước 3: Cài dependencies (nếu cần)...
echo.
if not exist "node_modules" (
    echo 📥 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install failed!
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ node_modules already exists
)

echo.
echo ========================================
echo 🎯 SẴN SÀNG TEST!
echo ========================================
echo.
echo Bước 4: Start dashboard...
echo.
echo 📝 License key trong file: LICENSE_KEY.txt
echo 🌐 Dashboard sẽ mở tại: http://localhost:3000
echo.
echo ⚠️  Sau khi dashboard start:
echo    1. Mở browser: http://localhost:3000
echo    2. Click "License" button
echo    3. Paste license key từ LICENSE_KEY.txt
echo    4. Click "Activate License"
echo.
echo Press any key to start dashboard...
pause >nul
echo.
echo 🚀 Starting dashboard...
echo.
call npm run dashboard
