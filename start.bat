@echo off
setlocal EnableExtensions
title Sweet Surprises - Cenoraazpis
cd /d "%~dp0"

set PORT=8080

echo.
echo  Sweet Surprises - Redaktor na cenoraazpisi
echo  -------------------------------------------
echo.

call :port_in_use
if not errorlevel 1 (
  echo  Port %PORT% veche e zaet ot star server.
  echo  Spirame go, za da startirame nanovo...
  call :free_port
  echo.
)

echo  Startirane na server na http://localhost:%PORT%
echo  Za da spresh servera, zatvori tozi prozorac.
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"
  python server.py %PORT%
  goto :stopped
)

where py >nul 2>&1
if %errorlevel%==0 (
  start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"
  py server.py %PORT%
  goto :stopped
)

where node >nul 2>&1
if %errorlevel%==0 (
  start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"
  npx --yes serve . -p %PORT%
  goto :stopped
)

echo Greshka: Python i Node.js ne sa nameri.
echo Instalirai Python ot https://www.python.org/downloads/
echo.
pause
goto :eof

:stopped
echo.
echo  Serverat spre. Ako ima greshka, vij saobshtenieto po-gore.
pause
goto :eof

:port_in_use
netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
exit /b %errorlevel%

:free_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
exit /b 0
