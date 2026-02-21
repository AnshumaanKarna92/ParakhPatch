@echo off
title Predictive Maintenance - Launcher
echo ===================================================
echo    Predictive Maintenance AI Dashboard Launcher
echo ===================================================
echo.
echo [1/3] Starting Backend API (Port 8000)...
start "Backend" cmd /k "uvicorn api:app --reload"
echo.
echo [2/3] Starting Web Dashboard (Port 3000)...
start "Dashboard" cmd /k "cd dashboard && npm start"
echo.
echo [3/3] Starting IoT Sensor Simulation...
start "Simulator" cmd /k "python pipeline_simulation.py"
echo.
echo ===================================================
echo ✅ All services started!
echo    - API: http://localhost:8000/docs
echo    - Web: http://localhost:3000
echo ===================================================
timeout /t 5
