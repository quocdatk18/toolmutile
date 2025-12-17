@echo off
REM Create shortcut with icon for START_DASHBOARD.bat
REM This script uses PowerShell to create a shortcut with a nice icon

setlocal enabledelayedexpansion

REM Get current directory
set "SCRIPT_DIR=%~dp0"

REM Create PowerShell script to make shortcut
set "PS_SCRIPT=%SCRIPT_DIR%create_shortcut.ps1"

(
echo $WshShell = New-Object -ComObject WScript.Shell
echo $Shortcut = $WshShell.CreateShortcut("%SCRIPT_DIR%START_DASHBOARD.lnk"^)
echo $Shortcut.TargetPath = "%SCRIPT_DIR%START_DASHBOARD.bat"
echo $Shortcut.WorkingDirectory = "%SCRIPT_DIR%"
echo $Shortcut.Description = "Khoi dong Dashboard"
echo $Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,110"
echo $Shortcut.Save(^)
echo Write-Host "Shortcut created successfully!"
) > "%PS_SCRIPT%"

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

REM Clean up
del "%PS_SCRIPT%"

echo.
echo ✅ Shortcut created: START_DASHBOARD.lnk
echo You can now use this shortcut to start the dashboard!
pause
