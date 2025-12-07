@echo off
echo Starting CivicSolve Application...
echo.

echo Checking MongoDB connection...
timeout /t 1 /nobreak >nul 2>&1

echo.
echo Starting Backend Server...
start "CivicSolve Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul 2>&1

echo.
echo Starting Frontend Server...
start "CivicSolve Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Application is starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo If MongoDB is not running, you need to:
echo 1. Install MongoDB: https://www.mongodb.com/try/download/community
echo 2. Start MongoDB service
echo OR
echo 3. Use Docker: docker-compose up
echo ========================================
pause


