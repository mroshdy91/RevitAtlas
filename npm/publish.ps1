# RevitAtlas npm Publish Script
# Usage: .\publish.ps1 [-DryRun] [-Otp 123456]
#
# Prerequisites:
#   1. Run build_release.ps1 first (builds binaries + packages npm directory)
#   2. npm login (authenticate to npm registry)
#   3. Create @revitatlas org on npm: https://www.npmjs.com/org/create
#
# Environment:
#   NPM_TOKEN - npm auth token (optional, uses npm login session if not set)
#   DRY_RUN   - set to "true" to skip actual publishing

param(
    [switch]$DryRun,
    [string]$Otp
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

Write-Host "RevitAtlas npm Publisher" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Verify packages are built
$Win32PkgDir = Join-Path $ScriptDir "win32-x64"
$MainPkgDir = Join-Path $ScriptDir "revitatlas"

$ServerBin = Join-Path $Win32PkgDir "bin\revitatlas-server.exe"
if (-not (Test-Path $ServerBin)) {
    Write-Error "Server binary not found at $ServerBin`nRun build_release.ps1 first."
    exit 1
}

$PluginDll = Join-Path $Win32PkgDir "plugin\RevitAtlas.dll"
if (-not (Test-Path $PluginDll)) {
    Write-Error "Plugin DLL not found at $PluginDll`nRun build_release.ps1 first."
    exit 1
}

# Read version from main package.json
$MainPkg = Get-Content (Join-Path $MainPkgDir "package.json") | ConvertFrom-Json
$Version = $MainPkg.version
Write-Host "`nPublishing version: $Version" -ForegroundColor White

# Sync version to platform package
$Win32PkgJson = Join-Path $Win32PkgDir "package.json"
$Win32Pkg = Get-Content $Win32PkgJson | ConvertFrom-Json
$Win32Pkg.version = $Version
$Win32Pkg | ConvertTo-Json -Depth 10 | Set-Content $Win32PkgJson -Encoding UTF8
Write-Host "Synced version to @revitatlas/win32-x64" -ForegroundColor Green

# Also sync the optionalDependencies version in main package
$MainPkgJson = Join-Path $MainPkgDir "package.json"
$MainPkg.optionalDependencies.'@revitatlas/win32-x64' = $Version
$MainPkg | ConvertTo-Json -Depth 10 | Set-Content $MainPkgJson -Encoding UTF8
Write-Host "Synced optionalDependencies version" -ForegroundColor Green

# Show package contents
Write-Host "`nPlatform package contents:" -ForegroundColor Yellow
$win32Files = Get-ChildItem $Win32PkgDir -Recurse -File
Write-Host "  Files: $($win32Files.Count)"
$win32Size = ($win32Files | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  Size: $([math]::Round($win32Size, 1)) MB"

Write-Host "`nMain package contents:" -ForegroundColor Yellow
$mainFiles = Get-ChildItem $MainPkgDir -Recurse -File
Write-Host "  Files: $($mainFiles.Count)"

if ($DryRun -or $env:DRY_RUN -eq "true") {
    Write-Host "`n[DRY RUN] Would publish:" -ForegroundColor Yellow
    Write-Host "  1. @revitatlas/win32-x64@$Version"
    Write-Host "  2. revitatlas@$Version"
    Write-Host "`nRun without -DryRun to publish for real." -ForegroundColor Gray
    exit 0
}

# Step 1: Publish platform package FIRST (must exist before main package resolves it)
Write-Host "`n[1/2] Publishing @revitatlas/win32-x64@$Version..." -ForegroundColor Yellow
Push-Location $Win32PkgDir
try {
    $otpArgs = if ($Otp) { "--otp=$Otp" } else { "" }
    npm publish --access public $otpArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to publish @revitatlas/win32-x64" }
    Write-Host "Published @revitatlas/win32-x64@$Version" -ForegroundColor Green
}
finally {
    Pop-Location
}

# Brief pause to let npm registry propagate
Write-Host "Waiting for npm registry propagation..."
Start-Sleep -Seconds 5

# Step 2: Publish main package
Write-Host "`n[2/2] Publishing revitatlas@$Version..." -ForegroundColor Yellow
Push-Location $MainPkgDir
try {
    $otpArgs = if ($Otp) { "--otp=$Otp" } else { "" }
    npm publish --access public $otpArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to publish revitatlas" }
    Write-Host "Published revitatlas@$Version" -ForegroundColor Green
}
finally {
    Pop-Location
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Published successfully!" -ForegroundColor Green
Write-Host "  npm install -g revitatlas" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
