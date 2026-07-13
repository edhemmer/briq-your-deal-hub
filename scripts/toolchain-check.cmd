@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0toolchain-check.ps1" %*
