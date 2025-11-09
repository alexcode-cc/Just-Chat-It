# Windows Build Guide

This guide helps you fix build issues on Windows, specifically for the `better-sqlite3` native module.

## Quick Fix

### Option 1: Automated Fix (Recommended)

Run one of the following scripts from the project root:

**PowerShell (Recommended):**
```powershell
.\fix-windows-sqlite-build.ps1
```

**Command Prompt:**
```cmd
fix-windows-sqlite-build.bat
```

### Option 2: Manual Fix

1. **Install setuptools** (fixes Python 3.12+ distutils issue):
   ```cmd
   pip install setuptools
   ```

2. **Rebuild better-sqlite3**:
   ```cmd
   cd node_modules\better-sqlite3
   node-gyp rebuild --release
   cd ..\..
   ```

## Common Build Errors and Solutions

### Error 1: "ModuleNotFoundError: No module named 'distutils'"

**Cause:** Python 3.12+ removed the `distutils` module.

**Solutions (choose one):**

1. **Install setuptools** (provides distutils):
   ```cmd
   pip install setuptools
   ```

2. **Use Python 3.11** (recommended if setuptools doesn't work):
   - Download Python 3.11.9: https://www.python.org/downloads/release/python-3119/
   - Install and add to PATH
   - Verify: `python --version` should show 3.11.x
   - Run: `npm rebuild better-sqlite3`

3. **Use prebuilt binaries** (fastest, no compilation):
   ```cmd
   npm uninstall better-sqlite3
   npm install better-sqlite3 --build-from-source=false
   ```

### Error 2: "error MSB8036: The Windows SDK version was not found"

**Cause:** Missing or incorrect Windows SDK installation.

**Solution:**
1. Install Visual Studio Build Tools 2019 or later
2. Download: https://visualstudio.microsoft.com/downloads/
3. Select "Desktop development with C++" workload
4. Ensure Windows SDK 10.0.x is selected
5. Restart terminal after installation

### Error 3: "gyp ERR! find VS"

**Cause:** Visual Studio Build Tools not found or not properly configured.

**Solution:**

1. **Install Visual Studio Build Tools:**
   - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Run installer
   - Select "Desktop development with C++"
   - Install

2. **Manual VS configuration:**
   ```cmd
   npm config set msvs_version 2019
   ```
   (or 2022 if you installed VS 2022)

3. **Verify installation:**
   ```cmd
   where cl.exe
   ```
   Should show path to Visual C++ compiler

### Error 4: "EPERM: operation not permitted"

**Cause:** File is locked by another process or insufficient permissions.

**Solutions:**

1. **Run as Administrator:**
   - Right-click PowerShell/CMD
   - Select "Run as Administrator"
   - Re-run the build script

2. **Close VSCode and other editors** that might lock files

3. **Disable antivirus temporarily** during build

4. **Clean and rebuild:**
   ```cmd
   rmdir /s /q node_modules\better-sqlite3\build
   npm rebuild better-sqlite3
   ```

### Error 5: "prebuild-install warn install No prebuilt binaries found"

**Cause:** No prebuilt binary available for your Node.js version or platform.

**Solution:**
This is a warning, not an error. The build will attempt to compile from source. Ensure you have:
- Python 3.11 (or setuptools for 3.12+)
- Visual Studio Build Tools
- Windows SDK

## System Requirements

### Required Software

1. **Node.js** 18.x or later
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Python** 3.11.x (recommended) or 3.12+ with setuptools
   - Download Python 3.11: https://www.python.org/downloads/release/python-3119/
   - **Important:** Check "Add Python to PATH" during installation
   - Verify: `python --version`

3. **Visual Studio Build Tools** 2019 or later
   - Download: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++" workload
   - Includes:
     - MSVC C++ build tools
     - Windows SDK
     - CMake tools (optional but helpful)

### Environment Variables

Verify these are in your PATH:
```cmd
where python
where node
where npm
where cl.exe
```

If any command is not found, add the respective installation directory to your PATH.

## Build Process Explanation

### What happens during `npm install`?

1. npm downloads `better-sqlite3` package
2. `better-sqlite3` tries to find a prebuilt binary for your platform
3. If no binary found, it runs `node-gyp rebuild`
4. `node-gyp` requires:
   - Python (for build scripts)
   - Visual Studio Build Tools (for C++ compilation)
   - Windows SDK (for Windows APIs)

### Why does better-sqlite3 need compilation?

`better-sqlite3` is a native Node.js addon that wraps the SQLite C library. It must be compiled for your specific:
- Operating system (Windows)
- Architecture (x64/x86)
- Node.js version (ABI compatibility)

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] Python 3.11+ is installed and in PATH
- [ ] If Python 3.12+, setuptools is installed (`pip list | findstr setuptools`)
- [ ] Node.js 18+ is installed (`node --version`)
- [ ] Visual Studio Build Tools are installed
- [ ] "Desktop development with C++" workload is installed
- [ ] Running terminal as Administrator
- [ ] Antivirus is not blocking the build
- [ ] No other processes are locking `node_modules`

## Alternative Solutions

### Use a Different Database

If you cannot resolve the build issues, consider using a different database that doesn't require native compilation:

1. **SQL.js** (SQLite compiled to WebAssembly)
   ```cmd
   npm install sql.js
   ```
   - No compilation needed
   - Slightly slower than native
   - Good for development

2. **LowDB** (JSON file database)
   ```cmd
   npm install lowdb
   ```
   - Simple JSON storage
   - No compilation
   - Good for small datasets

### Use WSL2 (Windows Subsystem for Linux)

If Windows build issues persist:

1. Install WSL2: https://learn.microsoft.com/en-us/windows/wsl/install
2. Install Ubuntu from Microsoft Store
3. Clone the project in WSL2
4. Build and run in Linux environment

## Getting Help

If you still encounter issues:

1. **Check existing issues:** https://github.com/WiseLibs/better-sqlite3/issues
2. **Create detailed bug report** including:
   - Python version (`python --version`)
   - Node.js version (`node --version`)
   - Windows version (`ver`)
   - Full error log
   - Steps you've already tried

## Prevention

### For future installations:

1. **Use the correct Python version from the start:**
   ```cmd
   npm config set python "C:\Python311\python.exe"
   ```

2. **Set VS version:**
   ```cmd
   npm config set msvs_version 2019
   ```

3. **Document your working setup** in your team's wiki

## Success Verification

After fixing the build, verify everything works:

```cmd
# Test the build
node -e "const db = require('better-sqlite3')(':memory:'); console.log('SQLite works!');"
```

Expected output:
```
SQLite works!
```

If you see this message, your build is successful!

## Resources

- **better-sqlite3 docs:** https://github.com/WiseLibs/better-sqlite3
- **node-gyp guide:** https://github.com/nodejs/node-gyp#on-windows
- **VS Build Tools:** https://visualstudio.microsoft.com/downloads/
- **Python downloads:** https://www.python.org/downloads/
- **Windows SDK:** https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
