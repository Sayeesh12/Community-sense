# Script to push to GitHub
Write-Host "=== Git Repository Status ===" -ForegroundColor Cyan
cd s:\Community-sense

Write-Host "`n1. Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`n2. Checking remote configuration..." -ForegroundColor Yellow
git remote -v

Write-Host "`n3. Checking branches..." -ForegroundColor Yellow
git branch -a

Write-Host "`n4. Checking commits..." -ForegroundColor Yellow
git log --oneline -5

Write-Host "`n5. Attempting to push..." -ForegroundColor Yellow
Write-Host "Note: You may need to authenticate with a Personal Access Token" -ForegroundColor Red
git push -u origin main

Write-Host "`n=== Done ===" -ForegroundColor Cyan

