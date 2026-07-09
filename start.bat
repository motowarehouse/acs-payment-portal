@echo off
cd /d "%~dp0"
echo ============================================
echo  Starting Motowarehouse ACS Payments...
echo  Once you see "Ready", open http://localhost:3000
echo  Press Ctrl+C in this window to stop the app.
echo ============================================
echo.
call npm run dev
pause
