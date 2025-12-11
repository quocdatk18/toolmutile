@echo off
chcp 65001 >nul
echo ========================================
echo 🔄 RESTART DASHBOARD
echo ========================================
echo.

echo 🛑 Đang tìm và dừng process cũ...
echo.

REM Kill all node processes running dashboard
for /f "tokens=2" %%a in ('tasklist ^| findstr "node.exe"') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✅ Đã dừng process cũ
echo.
echo 🚀 Đang khởi động lại...
echo.

start cmd /k "npm run dashboard"

echo.
echo ✅ Dashboard đã được khởi động lại!
echo    Mở: http://localhost:3000
echo.
pause
