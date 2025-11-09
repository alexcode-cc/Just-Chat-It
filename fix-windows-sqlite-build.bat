@echo off
REM ============================================
REM Just Chat It - Windows Build Fix Script
REM ============================================
REM This script fixes the better-sqlite3 native module build issue on Windows
REM caused by Python 3.12+ missing the distutils module

echo ============================================
echo Just Chat It - Windows SQLite Build Fix
echo ============================================
echo.

REM Check Python version
echo Step 1: Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11 from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Get Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Found Python version: %PYTHON_VERSION%
echo.

REM Check if Python is 3.12 or higher
echo Step 2: Checking if distutils fix is needed...
python -c "import sys; exit(0 if sys.version_info >= (3, 12) else 1)"
if %errorlevel% equ 0 (
    echo Python 3.12+ detected - installing setuptools to provide distutils...
    pip install setuptools
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install setuptools
        echo Please run: pip install setuptools
        pause
        exit /b 1
    )
    echo Setuptools installed successfully
) else (
    echo Python version is compatible ^(^<3.12^) - no distutils fix needed
)
echo.

REM Check for Visual Studio Build Tools
echo Step 3: Checking for Visual Studio Build Tools...
where cl.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Visual Studio Build Tools may not be properly configured
    echo If the build fails, please install Visual Studio Build Tools 2019 or later
    echo Download from: https://visualstudio.microsoft.com/downloads/
    echo.
    echo Make sure to install "Desktop development with C++" workload
    echo.
    pause
)
echo.

REM Clean previous build artifacts
echo Step 4: Cleaning previous build artifacts...
if exist node_modules\better-sqlite3\build (
    rmdir /s /q node_modules\better-sqlite3\build 2>nul
)
if exist node_modules\better-sqlite3\build.node (
    del /f /q node_modules\better-sqlite3\build.node 2>nul
)
echo Build artifacts cleaned
echo.

REM Rebuild better-sqlite3
echo Step 5: Rebuilding better-sqlite3...
echo This may take a few minutes...
echo.

cd node_modules\better-sqlite3
node-gyp rebuild --release
set BUILD_RESULT=%errorlevel%
cd ..\..

if %BUILD_RESULT% neq 0 (
    echo.
    echo ============================================
    echo BUILD FAILED
    echo ============================================
    echo.
    echo Common solutions:
    echo 1. Install setuptools: pip install setuptools
    echo 2. Use Python 3.11 instead of 3.12+
    echo 3. Install Visual Studio Build Tools 2019+
    echo 4. Try using prebuilt binaries: npm install --build-from-source=false
    echo.
    echo For more help, see: README.md ^(Windows Build Section^)
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo BUILD SUCCESSFUL
echo ============================================
echo.
echo better-sqlite3 has been successfully rebuilt!
echo You can now run: npm run dev
echo.
pause
