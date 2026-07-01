' Water Refilling Station POS Launcher - Hidden Window Version
Set WshShell = CreateObject("WScript.Shell")

strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)

WshShell.Run Chr(34) & strPath & "\start-pos.bat" & Chr(34), 0, False

Set WshShell = Nothing
