@echo off
setlocal EnableDelayedExpansion

:: =====================================================
:: Water Refilling Station POS - Desktop Build Script
:: =====================================================

title Building Water Refilling Station POS Desktop Package...

pushd "%~dp0"

set DIST_DIR=Water-Refilling-POS-Desktop
if not defined MONGODB_BIN set MONGODB_BIN=%~dp0mongodb\bin

echo Using MongoDB binaries from: %MONGODB_BIN%

if not exist "%MONGODB_BIN%\mongod.exe" (
    echo ERROR: mongod.exe not found at %MONGODB_BIN%
    echo Download MongoDB Community ZIP and extract to .\mongodb\
    popd
    pause
    exit /b 1
)

echo [1/4] Building frontend...
pushd web
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed.
    popd
    popd
    pause
    exit /b 1
)
popd

echo [2/4] Building backend...
pushd backend
call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed.
    popd
    popd
    pause
    exit /b 1
)
popd

echo [3/4] Packaging server.exe with pkg...
pushd backend
call npm run package:win
if errorlevel 1 (
    echo ERROR: pkg packaging failed.
    popd
    popd
    pause
    exit /b 1
)
popd

if not exist "backend\dist-desktop\server.exe" (
    echo ERROR: backend\dist-desktop\server.exe was not created.
    popd
    pause
    exit /b 1
)

echo [4/4] Assembling distribution folder...
if exist "%DIST_DIR%" rmdir /S /Q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\data"
mkdir "%DIST_DIR%\uploads"
mkdir "%DIST_DIR%\logs"
mkdir "%DIST_DIR%\backups"
mkdir "%DIST_DIR%\web\dist"

copy /Y "backend\dist-desktop\server.exe" "%DIST_DIR%\"
copy /Y "start-pos.bat" "%DIST_DIR%\"
copy /Y "start-pos.vbs" "%DIST_DIR%\"
copy /Y "backend\.env.desktop" "%DIST_DIR%\.env"
xcopy /E /I /Y "web\dist" "%DIST_DIR%\web\dist"

copy /Y "%MONGODB_BIN%\mongod.exe" "%DIST_DIR%\"
if exist "%MONGODB_BIN%\*.dll" copy /Y "%MONGODB_BIN%\*.dll" "%DIST_DIR%\"
if exist "%MONGODB_BIN%\vc_redist.x64.exe" copy /Y "%MONGODB_BIN%\vc_redist.x64.exe" "%DIST_DIR%\"

echo MongoDB binaries copied from %MONGODB_BIN%

echo.
echo Build complete: %DIST_DIR%\
echo Next steps:
echo   1. Update JWT secrets in %DIST_DIR%\.env
echo   2. Run %DIST_DIR%\start-pos.vbs
if exist "%DIST_DIR%\vc_redist.x64.exe" (
    echo   3. If mongod fails on first run, install %DIST_DIR%\vc_redist.x64.exe
)
echo.

popd
pause
