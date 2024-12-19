@echo off

:: Set project directory dynamically and handle spaces in the paths
set "PROJECT_DIR=%cd%"

:: Log directory paths for easier debugging
echo Running from "%PROJECT_DIR%"

:: 1. Check if MongoDB is installed on the system
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is not installed. Please install MongoDB manually or update your PATH.
    exit /b
)

:: 2. Check if Node.js is installed on the system
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js and npm.
    exit /b
)

:: 3. Ensure MongoDB data and log directories exist
set "MONGO_DB_PATH=%PROJECT_DIR%\backend\data\db"
set "MONGO_LOG_PATH=%PROJECT_DIR%\backend\logs"

if not exist "%MONGO_DB_PATH%" (
    echo Creating MongoDB data directory at "%MONGO_DB_PATH%"...
    mkdir "%MONGO_DB_PATH%"
)

if not exist "%MONGO_LOG_PATH%" (
    echo Creating MongoDB log directory at "%MONGO_LOG_PATH%"...
    mkdir "%MONGO_LOG_PATH%"
)

:: 4. Ensure any MongoDB lock files are removed before starting
if exist "%MONGO_DB_PATH%\mongod.lock" (
    echo Removing old MongoDB lock file...
    del "%MONGO_DB_PATH%\mongod.lock"
)

:: 5. Start MongoDB and keep the terminal open
echo Starting MongoDB...
mongod --dbpath "%MONGO_DB_PATH%" --logappend --logpath "%MONGO_LOG_PATH%\mongodb.log"

:: 6. Start the backend (Node.js server) in a new command window
echo Starting Node.js server...
start cmd /k "cd /d ""%PROJECT_DIR%\backend"" && node server.js"

:: 7. Start the front-end (React app) in a new command window
echo Starting React front-end...
start cmd /k "cd /d ""%PROJECT_DIR%\React\src"" && npm start"

:: 8. Ready to run YAML/SVG generation on form submission from frontend
echo Project is up and running!


