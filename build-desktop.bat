@echo off
setlocal EnableDelayedExpansion

:: =====================================================
:: Water Refilling Station POS - Desktop Build Script
:: =====================================================

title Building Water Refilling Station POS Desktop Package...

pushd "%~dp0"

set DIST_DIR=Water-Refilling-POS-Desktop
set LAUNCHER_PROJECT_DIR=launcher\StartPosLauncher
set LAUNCHER_GENERATED_DIR=%LAUNCHER_PROJECT_DIR%\generated
set LAUNCHER_ICON=%LAUNCHER_GENERATED_DIR%\WatermarksPOS.ico
set LAUNCHER_PUBLISH_DIR=%LAUNCHER_PROJECT_DIR%\publish
if not defined MONGODB_BIN set MONGODB_BIN=%~dp0mongodb\bin

set DOTNET_EXE=
if exist "%ProgramFiles%\dotnet\dotnet.exe" set "DOTNET_EXE=%ProgramFiles%\dotnet\dotnet.exe"
if not defined DOTNET_EXE for %%I in (dotnet.exe) do set "DOTNET_EXE=%%~$PATH:I"

if not defined DOTNET_EXE (
    echo ERROR: dotnet.exe was not found.
    echo Install the .NET 8 SDK or ensure dotnet is on PATH.
    popd
    pause
    exit /b 1
)

echo Using MongoDB binaries from: %MONGODB_BIN%

if not exist "%MONGODB_BIN%\mongod.exe" (
    echo ERROR: mongod.exe not found at %MONGODB_BIN%
    echo Download MongoDB Community ZIP and extract to .\mongodb\
    popd
    pause
    exit /b 1
)

echo [1/5] Building frontend...
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

echo [2/5] Building backend...
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

echo [3/5] Packaging server.exe with pkg...
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

echo [4/5] Building launcher EXE...
if not exist "%LAUNCHER_GENERATED_DIR%" mkdir "%LAUNCHER_GENERATED_DIR%"

if not exist "web\src\assets\Watermarks POS icon.ico" (
    echo ERROR: web\src\assets\Watermarks POS icon.ico was not found.
    popd
    pause
    exit /b 1
)

copy /Y "web\src\assets\Watermarks POS icon.ico" "%LAUNCHER_ICON%"

pushd "%LAUNCHER_PROJECT_DIR%"
call "%DOTNET_EXE%" publish "StartPosLauncher.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=false -p:ApplicationIcon="%~dp0%LAUNCHER_ICON%" -o "%~dp0%LAUNCHER_PUBLISH_DIR%"
if errorlevel 1 (
    echo ERROR: Launcher EXE build failed.
    popd
    popd
    pause
    exit /b 1
)
popd

if not exist "%LAUNCHER_PUBLISH_DIR%\start-pos.exe" (
    echo ERROR: %LAUNCHER_PUBLISH_DIR%\start-pos.exe was not created.
    popd
    pause
    exit /b 1
)

echo [5/5] Assembling distribution folder...
if exist "%DIST_DIR%" rmdir /S /Q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\data"
mkdir "%DIST_DIR%\uploads"
mkdir "%DIST_DIR%\logs"
mkdir "%DIST_DIR%\backups"
mkdir "%DIST_DIR%\web\dist"

copy /Y "%LAUNCHER_PUBLISH_DIR%\start-pos.exe" "%DIST_DIR%\"
copy /Y "backend\dist-desktop\server.exe" "%DIST_DIR%\"
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
echo   2. Run %DIST_DIR%\start-pos.exe
if exist "%DIST_DIR%\vc_redist.x64.exe" (
    echo   3. If mongod fails on first run, install %DIST_DIR%\vc_redist.x64.exe
)
echo.

popd
pause
