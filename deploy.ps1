# Saytni yig'ib, GitHub Pages'ga (gh-pages branch) chiqaradi.
# Ishlatish: ./deploy.ps1
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "web")
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build xatosi" }
$remote = git -C $PSScriptRoot remote get-url origin
Set-Location dist
New-Item -ItemType File -Force .nojekyll | Out-Null   # Jekyll _ bilan boshlangan fayllarni yashirmasin
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push -f $remote gh-pages
Remove-Item -Recurse -Force .git
