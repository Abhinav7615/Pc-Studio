#!/bin/bash
# Setup script to initialize Git and prepare for deployment

echo "🚀 PC Studio - Deployment Preparation Script"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git config user.name "PC Studio Bot"
    git config user.email "admin@pcstudio.com"
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files
echo ""
echo "📝 Adding files to git..."
git add .

# Show status
echo ""
echo "📊 Current git status:"
git status

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the files that will be committed"
echo "2. Run: git commit -m \"Initial commit: PC Studio website\""
echo "3. Create a repository on GitHub: https://github.com/new"
echo "4. Run: git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo "5. Run: git branch -M main"
echo "6. Run: git push -u origin main"
echo ""
echo "💡 Make sure to:"
echo "   - Replace YOUR_USERNAME with your GitHub username"
echo "   - Replace REPO_NAME with your repository name (e.g., pc-studio)"
echo ""
