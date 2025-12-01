@echo off
title Install Dependencies - Talking Robot
echo ========================================
echo   Installing Dependencies...
echo ========================================
echo.
cd /d "C:\TalkingRobot"
"C:\Program Files\nodejs\npm.cmd" install
echo.
echo Dependencies installed!
pause

