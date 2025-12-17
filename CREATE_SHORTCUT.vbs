' Create shortcut for START_DASHBOARD.bat with custom icon
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get current directory
strCurrentDir = objShell.CurrentDirectory

' Create shortcut
strShortcutPath = strCurrentDir & "\START_DASHBOARD.lnk"
Set objShortcut = objShell.CreateShortcut(strShortcutPath)

' Set shortcut properties
objShortcut.TargetPath = strCurrentDir & "\START_DASHBOARD.bat"
objShortcut.WorkingDirectory = strCurrentDir
objShortcut.Description = "Khởi động Dashboard"
objShortcut.WindowStyle = 1 ' Normal window

' Try to set icon (using system icon)
' Using a built-in Windows icon for startup/play
objShortcut.IconLocation = "C:\Windows\System32\shell32.dll,110"

' Save shortcut
objShortcut.Save

' Show message
MsgBox "✅ Shortcut created: " & strShortcutPath & vbCrLf & vbCrLf & "You can now use this shortcut to start the dashboard!", vbInformation, "Success"
