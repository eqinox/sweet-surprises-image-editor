@echo off
setlocal EnableExtensions
title Sweet Surprises - Cenoraazpis
cd /d "%~dp0"

set PORT=8080

echo.
echo  Sweet Surprises - Redaktor na cenoraazpisi
echo  -------------------------------------------
echo.

where npm >nul 2>&1
if not %errorlevel%==0 (
  echo Greshka: Node.js / npm ne sa nameri.
  echo Instalirai Node.js ot https://nodejs.org/
  echo.
  pause
  goto :eof
)

if not exist "node_modules\" (
  echo  Instalirane na paketi...
  echo.
  call npm install
  echo.
)

echo  Startirane na http://localhost:%PORT%
echo  Ot telefona: izpolzvai Network adresa, kogato se pokaje.
echo  Za da spresh, zatvori tozi prozorac.
echo.

start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%PORT%"
call npm run dev

echo.
echo  Serverat spre.
pause
