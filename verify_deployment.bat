@echo off
echo ---------------------------------------
echo   RM TEAM CRM - Deployment Assistant
echo ---------------------------------------
echo.
echo [1/3] Verifying npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error during installation.
    pause
    exit /b 1
)

echo.
echo [3/3] Building for production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ***********************************************
    echo  BUILD FAILED!
    echo  Please copy the error message above and share it with me.
    echo ***********************************************
    pause
    exit /b 1
)

echo.
echo ***********************************************
echo  BUILD SUCCESSFUL! 🚀
echo  Your app is ready for deployment.
echo.
echo  To deploy to Vercel, run: vercel --prod
echo  To preview locally, run: npm run preview
echo ***********************************************
pause
