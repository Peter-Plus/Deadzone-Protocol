@echo off
cd /d "%~dp0"
node tools/validator/validate.js %*
exit /b %errorlevel%
