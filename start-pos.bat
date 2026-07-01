@echo off
setlocal EnableDelayedExpansion

:: =====================================================
:: Water Refilling Station POS - Desktop Launcher
:: =====================================================

title Water Refilling Station POS Starting...

pushd "%~dp0"

if not exist "data" mkdir data
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

if not exist "mongod.exe" (
    if exist "mongodb\bin\mongod.exe" (
        set MONGOD_EXE=mongodb\bin\mongod.exe
    ) else (
        echo ERROR: mongod.exe not found!
        echo Expected mongod.exe in this folder or mongodb\bin\mongod.exe
        pause
        exit /b 1
    )
) else (
    set MONGOD_EXE=mongod.exe
)

if not exist "server.exe" (
    echo ERROR: server.exe not found!
    echo Please build the server first: npm run package:win
    pause
    exit /b 1
)

taskkill /F /IM mongod.exe 2>nul
taskkill /F /IM server.exe 2>nul
ping -n 3 127.0.0.1 >nul

echo [1/5] Starting MongoDB Server...
start /B "" "%MONGOD_EXE%" --dbpath "data" --bind_ip 127.0.0.1 --port 27017 --logpath "logs\mongodb.log" --logappend

echo [2/5] Waiting for MongoDB to initialize...
ping -n 4 127.0.0.1 >nul

netstat -an | findstr "LISTENING" | findstr ":27017" >nul
if errorlevel 1 (
    echo WARNING: MongoDB port 27017 not detected, waiting longer...
    ping -n 4 127.0.0.1 >nul
)

echo [3/6] Ensuring default admin account...
server.exe --seed-admin-only
if errorlevel 1 (
    echo ERROR: Admin account setup failed.
    echo Please check logs\error.log for details
    pause
    exit /b 1
)

echo [4/6] Starting Water Refilling Station POS Server...
start /B "" "server.exe"

echo [5/6] Waiting for server on port 5000...
ping -n 5 127.0.0.1 >nul

set SERVER_READY=0
for /L %%i in (1,1,15) do (
    curl -s http://127.0.0.1:5000/api/health >nul 2>&1
    if !errorlevel! == 0 (
        set SERVER_READY=1
        goto :server_ok
    )
    ping -n 2 127.0.0.1 >nul
)

:server_ok
if !SERVER_READY! == 0 (
    echo ERROR: Server failed to start on port 5000
    echo Please check logs\error.log for details
    pause
    exit /b 1
)

echo [6/6] Launching browser in kiosk mode...

set CHROME_PATHS="C:\Program Files\Google\Chrome\Application\chrome.exe" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set EDGE_PATHS="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "C:\Program Files\Microsoft\Edge\Application\msedge.exe"

for %%p in (%CHROME_PATHS%) do (
    if exist %%p (
        echo Starting Chrome in app mode...
        start "" %%p --app="http://127.0.0.1:5000" --start-fullscreen --kiosk --disable-pinch --overscroll-history-navigation=0
        goto :browser_started
    )
)

for %%p in (%EDGE_PATHS%) do (
    if exist %%p (
        echo Starting Edge in app mode...
        start "" %%p --app="http://127.0.0.1:5000" --start-fullscreen --kiosk
        goto :browser_started
    )
)

start http://127.0.0.1:5000

:browser_started
echo.
echo Water Refilling Station POS is now running!
echo Close this window to stop MongoDB and the server.
echo.

:wait_loop
ping -n 6 127.0.0.1 >nul
goto :wait_loop

:end
taskkill /F /IM mongod.exe 2>nul
taskkill /F /IM server.exe 2>nul
popd
