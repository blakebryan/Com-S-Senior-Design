@echo off

:: Set project directory dynamically and handle spaces in the paths
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: Log directory paths for easier debugging
echo Running installer from "%PROJECT_DIR%"

:: 1. Check if Node.js is installed on the system
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js and npm.
    pause
    exit /b
)

:: 2. Check if MongoDB is installed on the system
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is not installed or not in PATH.
    echo Attempting to add MongoDB to PATH...
    goto AddMongoToPath
) else (
    echo MongoDB is installed and in PATH.
    goto InstallDependencies
)

:AddMongoToPath
:: Assuming default MongoDB installation path
set "MONGO_DEFAULT_PATH=C:\Program Files\MongoDB\Server\5.0\bin"

if exist "%MONGO_DEFAULT_PATH%\mongod.exe" (
    echo MongoDB found at default path: "%MONGO_DEFAULT_PATH%"
    echo Adding MongoDB to system PATH...

    :: Add MongoDB path to system PATH
    setx /M PATH "%PATH%;%MONGO_DEFAULT_PATH%"
    if %errorlevel% neq 0 (
        echo Failed to add MongoDB to system PATH. Please run this script as administrator.
        echo Alternatively, manually add "%MONGO_DEFAULT_PATH%" to your system PATH.
        pause
        exit /b
    ) else (
        echo MongoDB path added to system PATH.
        goto InstallDependencies
    )
) else (
    echo MongoDB not found at default path "%MONGO_DEFAULT_PATH%".
    echo Please ensure MongoDB is installed and added to your PATH.
    pause
    exit /b
)

:InstallDependencies
:: 3. Install backend dependencies
echo Installing backend dependencies...
cd /d "%PROJECT_DIR%\backend"
npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b
)

:: 4. Install frontend dependencies
echo Installing frontend dependencies...
cd /d "%PROJECT_DIR%\React\src"
npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b
)

:: 5. Install gsn_suas dependencies
echo Installing gsn_suas dependencies...
cd /d "%PROJECT_DIR%\gsn_suas"
npm install
if %errorlevel% neq 0 (
    echo Failed to install gsn_suas dependencies.
    pause
    exit /b
)

echo Installation complete.
pause
