@echo off
REM Shubh Consultancy - Build & Deploy Script for Windows

echo 🔧 Starting Build Process...

REM Step 1: Clean previous builds
echo 📦 Cleaning old builds...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM Step 2: Install dependencies
echo 📥 Installing dependencies...
call npm install

REM Step 3: Build
echo 🏗️ Building project...
call npm run build

REM Step 4: Check if build succeeded
if exist out (
    echo ✅ Build successful!
    echo 📂 Output folder: ./out
    echo.
    echo 📋 Next Steps:
    echo 1. Upload 'out' folder contents to your hosting
    echo 2. Or deploy to Render/Railway/Vercel
    echo.
    explorer out
) else (
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

pause
