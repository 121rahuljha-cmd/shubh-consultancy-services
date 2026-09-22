#!/bin/bash
# Shubh Consultancy - Build & Deploy Script

echo "🔧 Starting Build Process..."

# Step 1: Clean previous builds
echo "📦 Cleaning old builds..."
rm -rf .next out dist

# Step 2: Install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 3: Build
echo "🏗️ Building project..."
npm run build

# Step 4: Check if build succeeded
if [ -d "out" ]; then
    echo "✅ Build successful!"
    echo "📂 Output folder: ./out"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Upload 'out' folder contents to your hosting"
    echo "2. Or deploy to Render/Railway/Vercel"
    echo ""
    echo "📊 Files generated: $(find out -type f | wc -l) files"
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi
