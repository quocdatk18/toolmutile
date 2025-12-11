@echo off
echo ========================================
echo   Creating Distribution Package
echo ========================================
echo.

REM Get current date for version
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set VERSION=%datetime:~0,8%

set DIST_NAME=hidemium-multi-tool-v%VERSION%
set DIST_DIR=..\dist\%DIST_NAME%

echo Creating distribution: %DIST_NAME%
echo.

REM Create dist directory
if not exist ..\dist mkdir ..\dist
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"

echo Copying files...

REM Copy main folders
xcopy /E /I /Y config "%DIST_DIR%\config"
xcopy /E /I /Y core "%DIST_DIR%\core"
xcopy /E /I /Y dashboard "%DIST_DIR%\dashboard"
xcopy /E /I /Y tools "%DIST_DIR%\tools"

REM Copy root files
copy /Y package.json "%DIST_DIR%\"
copy /Y package-lock.json "%DIST_DIR%\"
copy /Y START_DASHBOARD.bat "%DIST_DIR%\"
copy /Y INSTALL.bat "%DIST_DIR%\"
copy /Y README.md "%DIST_DIR%\"

REM Copy essential docs
copy /Y TESTING_GUIDE.md "%DIST_DIR%\"
copy /Y STANDALONE_ANALYSIS.md "%DIST_DIR%\"

REM Create INSTALL_FIRST.txt
echo ========================================> "%DIST_DIR%\INSTALL_FIRST.txt"
echo   Hidemium Multi-Tool Installation>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo ========================================>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo.>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo 1. Run INSTALL.bat to install dependencies>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo 2. Run START_DASHBOARD.bat to start the dashboard>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo 3. Open http://localhost:3000 in your browser>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo.>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo Requirements:>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo - Node.js 16+ installed>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo - Hidemium running with Local API enabled>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo.>> "%DIST_DIR%\INSTALL_FIRST.txt"
echo For more info, see README.md>> "%DIST_DIR%\INSTALL_FIRST.txt"

echo.
echo Creating ZIP archive...
cd ..\dist
powershell Compress-Archive -Path "%DIST_NAME%" -DestinationPath "%DIST_NAME%.zip" -Force
cd ..\hidemium-multi-tool

echo.
echo ========================================
echo   Distribution created successfully!
echo ========================================
echo.
echo Location: ..\dist\%DIST_NAME%.zip
echo Size: 
dir /s "..\dist\%DIST_NAME%.zip" | find "bytes"
echo.
echo Ready to distribute!
echo.
pause
