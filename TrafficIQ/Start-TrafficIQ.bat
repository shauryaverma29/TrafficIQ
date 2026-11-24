@echo off
setlocal
title TrafficIQ Launcher

REM Use this file's location as the project root.
set "ROOT=%~dp0"

echo.
echo ==========================================
echo          Starting TrafficIQ
echo ==========================================
echo.

REM Check backend environment.
if not exist "%ROOT%backend\venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    py -m venv "%ROOT%backend\venv"
    if errorlevel 1 (
        echo ERROR: Could not create the Python environment.
        pause
        exit /b 1
    )
    echo Installing Python dependencies...
    "%ROOT%backend\venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt"
    if errorlevel 1 (
        echo ERROR: Python dependency installation failed.
        pause
        exit /b 1
    )
)

REM Install frontend packages only if node_modules is missing.
if not exist "%ROOT%frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%ROOT%frontend"
    call npm install
    if errorlevel 1 (
        popd
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
    popd
)

echo Starting Flask backend on port 5000...
start "TrafficIQ Backend" cmd /k "cd /d ""%ROOT%backend"" && call venv\Scripts\activate.bat && python app.py"

echo Starting React frontend on port 5173...
start "TrafficIQ Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

echo Waiting for the development servers to start...
timeout /t 7 /nobreak >nul

echo Opening TrafficIQ in your browser...
start "" "http://localhost:5173"

echo.
echo TrafficIQ startup commands have been launched.
echo Keep both server windows open while using the website.
echo Close the two server windows to stop TrafficIQ.
echo.
endlocal
