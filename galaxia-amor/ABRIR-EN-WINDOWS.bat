@echo off
title Galaxia de amor - servidor local
cd /d "%~dp0"
set PUERTO=8000

where python >nul 2>nul
if %errorlevel%==0 (
  echo Abriendo la galaxia en http://localhost:%PUERTO%
  echo NO cierres esta ventana mientras la pruebas. Para terminar, cierrala.
  start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PUERTO%"
  python -m http.server %PUERTO%
  goto fin
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Abriendo la galaxia en http://localhost:%PUERTO%
  echo NO cierres esta ventana mientras la pruebas. Para terminar, cierrala.
  start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PUERTO%"
  py -m http.server %PUERTO%
  goto fin
)

echo.
echo No se encontro Python en esta computadora.
echo No pasa nada: tambien puedes abrir index.html con doble clic
echo (funciona casi todo), o subir la carpeta a Netlify Drop.
echo.
pause

:fin
