@echo off
cd /d "%~dp0"
node tools/compiler/build.js %*
exit /b %errorlevel%
