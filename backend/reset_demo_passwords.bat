@echo off
REM Reset demo account passwords for PageRodeo
REM This script can be run manually or scheduled via Windows Task Scheduler

cd /d "%~dp0"
echo Resetting demo account passwords...
python manage.py reset_demo_passwords
echo.
echo Done! Check the output above for any errors.
pause

