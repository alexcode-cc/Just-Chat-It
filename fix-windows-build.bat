@echo off
echo ============================================
echo Just Chat It - Windows Build Fix
echo ============================================
echo.
echo This script will fix the better-sqlite3 native module issue on Windows.
echo.

echo Step 1: Installing electron-rebuild...
call npm install --save-dev electron-rebuild
if %errorlevel% neq 0 (
    echo Failed to install electron-rebuild
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Rebuilding better-sqlite3 for Electron...
call npm run rebuild
if %errorlevel% neq 0 (
    echo Failed to rebuild better-sqlite3
    echo.
    echo You may need to install Windows Build Tools:
    echo npm install --global windows-build-tools
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo Fix completed successfully!
echo ============================================
echo.
echo You can now run: npm run dev
echo.
pause
