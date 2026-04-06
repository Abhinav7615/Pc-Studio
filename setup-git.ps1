# Setup script to initialize Git and prepare for deployment (PowerShell)

Write-Host "🚀 PC Studio - Deployment Preparation Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .\.git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git config user.name "PC Studio Bot"
    git config user.email "admin@pcstudio.com"
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Add all files
Write-Host ""
Write-Host "📝 Adding files to git..." -ForegroundColor Yellow
git add .

# Show status
Write-Host ""
Write-Host "📊 Current git status:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the files that will be committed"
Write-Host "2. Run: git commit -m 'Initial commit: PC Studio website'"
Write-Host "3. Create a repository on GitHub: https://github.com/new"
Write-Host "4. Run: git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
Write-Host "5. Run: git branch -M main"
Write-Host "6. Run: git push -u origin main"
Write-Host ""
Write-Host "💡 Make sure to:" -ForegroundColor Yellow
Write-Host "   - Replace YOUR_USERNAME with your GitHub username"
Write-Host "   - Replace REPO_NAME with your repository name (e.g., pc-studio)"
Write-Host ""
