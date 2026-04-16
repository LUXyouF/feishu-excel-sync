@echo off
cd /d "%~dp0"
echo Starting ngrok tunnel...
start /b npx ngrok http 3000 > ngrok_url.txt 2>&1
echo Waiting for ngrok to start...
timeout /t 5 /nobreak > nul
echo.
echo ========================================
echo Please check the ngrok window for the URL
echo Or open: http://localhost:4040/api/tunnels
echo ========================================
echo.
pause
