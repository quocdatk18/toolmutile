@echo off
echo ========================================
echo   MIGRATE SCREENSHOTS TO NEW STRUCTURE
echo ========================================
echo.

echo This will migrate old screenshot structure to new session-based structure.
echo Old: screenshots/username/file-timestamp.png
echo New: screenshots/username/sessionId/file.png
echo.

set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Migration cancelled.
    pause
    exit /b
)

echo.
echo Running migration script...
node migrate-to-session-structure.js

echo.
echo ========================================
echo   DONE!
echo ========================================
echo.
pause
