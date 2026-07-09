@echo off
cd /d "%~dp0"
echo ============================================
echo  Motowarehouse ACS Payments - First-time setup
echo ============================================
echo.
echo This installs dependencies, creates the database tables,
echo and sets up your two login accounts. It only needs to run once.
echo.
echo Make sure you have pasted your Railway DATABASE_URL into the .env file
echo (copy .env.example to .env first) before continuing!
echo.
pause

echo.
echo [1/3] Installing dependencies (this can take a few minutes)...
call npm install
if errorlevel 1 goto :error

echo.
echo [2/3] Creating database tables...
call npx prisma db push
if errorlevel 1 goto :error

echo.
echo [3/3] Creating the two login accounts...
call npm run db:seed
if errorlevel 1 goto :error

echo.
echo ============================================
echo  Setup complete! Run start.bat to launch the app.
echo ============================================
pause
exit /b 0

:error
echo.
echo Something went wrong. Please check the message above.
pause
exit /b 1
