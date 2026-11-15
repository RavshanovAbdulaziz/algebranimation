# Manim videolarini render qilib, veb-saytga ko'chiradi.
# Ishlatish:  cd manim; ./render.ps1                         (barcha sahnalar, 720p)
#             ./render.ps1 -Quality h                        (1080p)
#             ./render.ps1 -Scenes @("Sarrus","GaussUsuli")  (faqat tanlanganlar)
#
# Eslatma: render natijasi %TEMP% ga yoziladi, chunki ffmpeg yo'ldagi apostrofni
# (masalan "Abdulaziz's PC") ko'tara olmaydi.
param(
  [string]$Quality = "m",
  [string[]]$Scenes = @()
)

# PowerShell 5.1 native dasturning stderr'ini (Manim loglari) xato deb hisoblaydi,
# shuning uchun "Stop" emas: natijani $LASTEXITCODE orqali tekshiramiz.
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
$media = Join-Path $env:TEMP "algebranimation-media"
New-Item -ItemType Directory -Force $media | Out-Null
$dest = Join-Path $PSScriptRoot "..\web\public\videos"
New-Item -ItemType Directory -Force $dest | Out-Null

if ($Scenes.Count -eq 0) {
  # scenes.py dagi barcha sahna sinflari (LT bazaviy sinfining o'zidan tashqari)
  $Scenes = Select-String -Path scenes.py -Pattern '^class (\w+)\((LT|Scene)\):' |
    ForEach-Object { $_.Matches[0].Groups[1].Value } | Where-Object { $_ -ne "LT" }
}

$failed = @()
foreach ($s in $Scenes) {
  uv run manim "-q$Quality" --media_dir $media scenes.py $s 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { "XATO: $s"; $failed += $s; continue }
  $f = Get-ChildItem -Recurse -Filter "$s.mp4" (Join-Path $media "videos") | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($f) { Copy-Item $f.FullName (Join-Path $dest "$s.mp4") -Force; "OK: $s" } else { "Topilmadi: $s"; $failed += $s }
}
if ($failed.Count) { "Muvaffaqiyatsiz: $($failed -join ', ')"; exit 1 }
