# ============================================
# Just Chat It - Windows SQLite Build Fix (PowerShell)
# ============================================
# This script fixes the better-sqlite3 native module build issue on Windows
# caused by Python 3.12+ missing the distutils module

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Just Chat It - Windows SQLite Build Fix" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check command exists
function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Step 1: Check Python installation
Write-Host "Step 1: Checking Python installation..." -ForegroundColor Yellow
if (-not (Test-CommandExists python)) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.11 from https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$pythonVersion = python --version 2>&1 | Out-String
Write-Host "Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Check Python version and install setuptools if needed
Write-Host "Step 2: Checking if distutils fix is needed..." -ForegroundColor Yellow

# Get Python version numbers
$versionMatch = $pythonVersion -match "Python (\d+)\.(\d+)\.(\d+)"
if ($versionMatch) {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]

    if ($major -ge 3 -and $minor -ge 12) {
        Write-Host "Python 3.12+ detected - installing setuptools to provide distutils..." -ForegroundColor Yellow

        # Install setuptools
        $setuptoolsResult = pip install setuptools 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to install setuptools" -ForegroundColor Red
            Write-Host "Please run manually: pip install setuptools" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "Setuptools installed successfully" -ForegroundColor Green
    } else {
        Write-Host "Python version is compatible (<3.12) - no distutils fix needed" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: Could not parse Python version, proceeding anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check for Node.js
Write-Host "Step 3: Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Test-CommandExists node)) {
    Write-Host "ERROR: Node.js is not installed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
$nodeVersion = node --version
Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 4: Check for Visual Studio Build Tools
Write-Host "Step 4: Checking for Visual Studio Build Tools..." -ForegroundColor Yellow
if (-not (Test-CommandExists cl.exe)) {
    Write-Host "WARNING: Visual Studio Build Tools may not be properly configured" -ForegroundColor Yellow
    Write-Host "If the build fails, please install Visual Studio Build Tools 2019 or later" -ForegroundColor Yellow
    Write-Host "Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Make sure to install 'Desktop development with C++' workload" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}
Write-Host ""

# Step 5: Clean previous build artifacts
Write-Host "Step 5: Cleaning previous build artifacts..." -ForegroundColor Yellow
$buildPath = "node_modules\better-sqlite3\build"
if (Test-Path $buildPath) {
    Remove-Item -Path $buildPath -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Build artifacts cleaned" -ForegroundColor Green
Write-Host ""

# Step 6: Rebuild better-sqlite3
Write-Host "Step 6: Rebuilding better-sqlite3..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

Push-Location "node_modules\better-sqlite3"
$buildOutput = node-gyp rebuild --release 2>&1
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Install setuptools: pip install setuptools" -ForegroundColor White
    Write-Host "2. Use Python 3.11 instead of 3.12+: https://www.python.org/downloads/release/python-3119/" -ForegroundColor White
    Write-Host "3. Install Visual Studio Build Tools 2019+" -ForegroundColor White
    Write-Host "4. Try using prebuilt binaries instead:" -ForegroundColor White
    Write-Host "   npm uninstall better-sqlite3" -ForegroundColor White
    Write-Host "   npm install better-sqlite3 --build-from-source=false" -ForegroundColor White
    Write-Host ""
    Write-Host "For more help, see: docs/WINDOWS_BUILD_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "better-sqlite3 has been successfully rebuilt!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
