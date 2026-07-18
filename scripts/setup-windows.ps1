<#
.SYNOPSIS
  Audits and installs all Windows dependencies for Scenic AI Guide.

.DESCRIPTION
  Designed for a clean Windows 11 machine and safe repeat runs. It checks the
  operating system, disk, network, ports, project files, Node.js and pnpm;
  installs missing runtime dependencies; preserves secrets; backs up SQLite;
  installs locked dependencies; runs boundary tests; builds the frontend; and
  performs a production health-check smoke test.

.EXAMPLE
  .\scripts\setup-windows.ps1 -CheckOnly

.EXAMPLE
  .\scripts\setup-windows.ps1

.EXAMPLE
  .\scripts\setup-windows.ps1 -ConfigureCloudLlm -LlmModel "ACCOUNT_MODEL_ID" -StartAfterInstall

.EXAMPLE
  .\scripts\setup-windows.ps1 -NpmRegistry "https://registry.npmmirror.com/" -InstallBuildTools
#>
#Requires -Version 5.1

[CmdletBinding()]
param(
  [ValidateSet("Development", "Production")]
  [string]$Mode = "Production",
  [switch]$ConfigureCloudLlm,
  [string]$LlmBaseUrl = "https://api.openai.com/v1",
  [string]$LlmModel = "gpt-4o-mini",
  [string]$NpmRegistry = "https://registry.npmjs.org/",
  [switch]$CheckOnly,
  [switch]$InstallBuildTools,
  [switch]$SkipNetworkCheck,
  [switch]$SkipTests,
  [switch]$StartAfterInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $ProjectRoot "server"
$WebDir = Join-Path $ProjectRoot "web"
$ServerEnv = Join-Path $ServerDir ".env"
$ServerEnvExample = Join-Path $ServerDir ".env.example"
$DatabasePath = Join-Path $ServerDir "data\scenic.sqlite"
$SetupLogDir = Join-Path $ProjectRoot ".setup-logs"
$script:Warnings = [Collections.Generic.List[string]]::new()

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Pass([string]$Message) {
  Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
  $script:Warnings.Add($Message)
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
  )
  Write-Host "> $Command $($Arguments -join ' ')" -ForegroundColor DarkGray
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')"
  }
}

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Get-CommandVersion([string]$Command, [string[]]$Arguments) {
  $text = (& $Command @Arguments 2>$null | Select-Object -First 1)
  return [string]$text
}

function Get-MajorVersion([string]$VersionText) {
  $match = [regex]::Match($VersionText, '(?<major>\d+)')
  if (-not $match.Success) { return 0 }
  return [int]$match.Groups['major'].Value
}

function Test-TcpPortAvailable([string]$HostName, [int]$Port) {
  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Parse($HostName), $Port)
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    try { $listener.Stop() } catch { }
  }
}

function Test-HttpEndpoint([string]$Url, [int]$TimeoutSeconds = 8) {
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return $true }
    } catch {
      if ($attempt -lt 3) { Start-Sleep -Milliseconds (500 * $attempt) }
    }
  }
  return $false
}

function Set-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value
  )
  $lines = [Collections.Generic.List[string]]::new()
  if (Test-Path -LiteralPath $Path) {
    foreach ($line in [IO.File]::ReadAllLines($Path)) { $lines.Add($line) }
  }
  $pattern = '^\s*' + [regex]::Escape($Name) + '\s*='
  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$Name=$Value"
      $updated = $true
      break
    }
  }
  if (-not $updated) { $lines.Add("$Name=$Value") }
  [IO.File]::WriteAllLines($Path, $lines, [Text.UTF8Encoding]::new($false))
}

function Get-DotEnvValue([string]$Path, [string]$Name) {
  if (-not (Test-Path -LiteralPath $Path)) { return "" }
  $pattern = '^\s*' + [regex]::Escape($Name) + '\s*=(?<value>.*)$'
  foreach ($line in [IO.File]::ReadAllLines($Path)) {
    $match = [regex]::Match($line, $pattern)
    if ($match.Success) { return $match.Groups['value'].Value.Trim() }
  }
  return ""
}

function New-RandomSecret([int]$ByteCount = 48) {
  $bytes = New-Object byte[] $ByteCount
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes)
}

function Install-NodeLts {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw @"
Node.js 20+ is missing and winget is unavailable.
1. Install 'App Installer' from Microsoft Store to obtain winget, or install Node.js LTS from https://nodejs.org/.
2. Open a new PowerShell window.
3. Run this script again.
"@
  }
  Invoke-Checked winget source update
  Invoke-Checked winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements --silent
  Refresh-ProcessPath
}

function Install-VcBuildTools {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "winget is required to install Visual C++ Build Tools automatically."
  }
  Write-Step "Installing Visual C++ Build Tools (this can take several minutes)"
  Invoke-Checked winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --accept-package-agreements --accept-source-agreements --silent --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
}

function Install-BackendDependencies {
  Push-Location $ServerDir
  try {
    try {
      Invoke-Checked npm.cmd ci --no-audit --fund=false
    } catch {
      if (-not $InstallBuildTools) {
        throw @"
Backend dependency installation failed. A common cause is better-sqlite3 lacking a prebuilt binary for the active Node version.
Recommended recovery:
1. Use Node.js LTS rather than a copied Node executable.
2. Delete copied node_modules folders and rerun this script; npm ci recreates server/node_modules.
3. If native compilation is required, rerun with -InstallBuildTools.
Original error: $($_.Exception.Message)
"@
      }
      Install-VcBuildTools
      Invoke-Checked npm.cmd ci --no-audit --fund=false
    }
  } finally {
    Pop-Location
  }
}

function Backup-ExistingDatabase {
  if (-not (Test-Path -LiteralPath $DatabasePath)) { return }
  $backupDir = Join-Path $ServerDir "backups"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupPath = Join-Path $backupDir "pre-setup-$stamp.sqlite"
  Copy-Item -LiteralPath $DatabasePath -Destination $backupPath
  Write-Pass "Existing database backed up to server/backups/$([IO.Path]::GetFileName($backupPath))"
}

function Start-SmokeTestServer {
  param([switch]$KeepRunning)
  if (-not (Test-TcpPortAvailable "127.0.0.1" 5178)) {
    try {
      $existing = Invoke-RestMethod -Uri "http://127.0.0.1:5178/api/health" -TimeoutSec 3
      if ($existing.success) {
        Write-Warn "Port 5178 already hosts a healthy project server; a second smoke-test server was not started."
        if ($KeepRunning) { return [pscustomobject]@{ Id = "existing" } }
        return $null
      }
    } catch { }
    throw "Port 5178 is occupied by another process. Stop it (Get-NetTCPConnection -LocalPort 5178) and rerun."
  }

  New-Item -ItemType Directory -Force -Path $SetupLogDir | Out-Null
  $stdout = Join-Path $SetupLogDir "server-smoke.out.log"
  $stderr = Join-Path $SetupLogDir "server-smoke.err.log"
  $nodePath = (Get-Command node.exe).Source
  $process = Start-Process -FilePath $nodePath -ArgumentList "src/app.mjs" -WorkingDirectory $ServerDir -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

  $healthy = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    if ($process.HasExited) { break }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:5178/api/health" -TimeoutSec 2
      if ($health.success) { $healthy = $true; break }
    } catch { }
  }
  if (-not $healthy) {
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
    $errorTail = if (Test-Path $stderr) { (Get-Content $stderr -Tail 20) -join "`n" } else { "No error log." }
    throw "Production smoke test failed. Log: .setup-logs/server-smoke.err.log`n$errorTail"
  }

  Write-Pass "Production health check returned success on http://127.0.0.1:5178/api/health"
  if ($KeepRunning) {
    Write-Pass "Production server remains running (PID $($process.Id))."
    return $process
  }
  Stop-Process -Id $process.Id
  Write-Pass "Temporary smoke-test server stopped."
  return $null
}

Write-Host "Scenic AI Guide - Windows 11 reusable setup" -ForegroundColor White
Write-Host "Project: $ProjectRoot"
Write-Host "Mode: $Mode"

Write-Step "Preflight checks"
if ($env:OS -ne "Windows_NT") { throw "This script only supports Windows." }
if ($PSVersionTable.PSVersion -lt [version]"5.1") { throw "PowerShell 5.1 or newer is required." }
Write-Pass "PowerShell $($PSVersionTable.PSVersion)"

$os = Get-CimInstance Win32_OperatingSystem
$build = [int]$os.BuildNumber
if ($build -lt 22000) {
  Write-Warn "Detected Windows build $build. Windows 11 build 22000+ is recommended."
} else {
  Write-Pass "$($os.Caption), build $build"
}
if (-not [Environment]::Is64BitOperatingSystem) { throw "A 64-bit Windows installation is required." }
Write-Pass "64-bit operating system"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdministrator) { Write-Pass "PowerShell is running as Administrator" }
else { Write-Warn "PowerShell is not elevated. Node.js may install normally, but Visual C++ Build Tools can require an Administrator terminal." }

$requiredProjectFiles = @(
  (Join-Path $ServerDir "package.json"),
  (Join-Path $ServerDir "package-lock.json"),
  (Join-Path $ServerDir ".env.example"),
  (Join-Path $WebDir "package.json"),
  (Join-Path $WebDir "pnpm-lock.yaml"),
  (Join-Path $WebDir ".env"),
  (Join-Path $WebDir ".env.development")
)
$missingProjectFiles = @($requiredProjectFiles | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missingProjectFiles.Count -gt 0) {
  throw "Project files or lockfiles are incomplete. Keep this script under scenic-ai-guide/scripts/."
}
Write-Pass "Project structure and dependency lockfiles"

$materialRoot = Join-Path $ProjectRoot "docs\scenic-materials"
$officialExcel = @(Get-ChildItem -LiteralPath $materialRoot -Filter "*.xlsx" -ErrorAction SilentlyContinue)
$officialDocx = @(Get-ChildItem -LiteralPath $materialRoot -Filter "*.docx" -ErrorAction SilentlyContinue)
if ($officialExcel.Count -lt 1 -or $officialDocx.Count -lt 2) {
  Write-Warn "Official scenic materials are incomplete; knowledge rebuild or behavior analytics import may be unavailable."
} else {
  Write-Pass "Official scenic DOCX/XLSX materials"
}

if ($ProjectRoot.StartsWith("\\")) { throw "UNC network paths are not supported. Copy the project to a local NTFS drive." }
$drive = Get-PSDrive -Name ([IO.Path]::GetPathRoot($ProjectRoot).Substring(0, 1))
$freeGb = [math]::Round($drive.Free / 1GB, 1)
if ($freeGb -lt 4) { throw "At least 4 GB free disk space is required; only $freeGb GB is available." }
if ($freeGb -lt 8) { Write-Warn "Only $freeGb GB free disk space is available; 8 GB or more is recommended." }
else { Write-Pass "$freeGb GB free disk space" }

if ($ProjectRoot.Length -gt 160) { Write-Warn "The project path is long. Move it closer to a drive root if native builds fail." }
if ($ProjectRoot -match '(?i)\\OneDrive\\') { Write-Warn "The project is inside OneDrive. Sync locks can interfere with node_modules and SQLite." }
if ($ExecutionContext.SessionState.LanguageMode -ne "FullLanguage") { throw "PowerShell FullLanguage mode is required." }

if (-not $SkipNetworkCheck) {
  if (-not (Test-HttpEndpoint $NpmRegistry)) {
    $networkMessage = "Cannot reach npm registry: $NpmRegistry. Check DNS, proxy, firewall, or use -NpmRegistry with a reachable mirror."
    if ($CheckOnly) { Write-Warn $networkMessage }
    else { throw $networkMessage }
  } else {
    Write-Pass "Package registry reachable: $NpmRegistry"
  }
} else {
  Write-Warn "Network preflight was skipped. Dependency installation may still require internet access."
}

$backendPortAvailable = Test-TcpPortAvailable "127.0.0.1" 5178
if (-not $backendPortAvailable) {
  $portMessage = "Backend port 5178 is already in use. Stop the running service before dependency installation."
  if ($CheckOnly) { Write-Warn $portMessage } else { throw $portMessage }
} else { Write-Pass "Backend port 5178 is available" }
if ($Mode -eq "Development") {
  if (-not (Test-TcpPortAvailable "127.0.0.1" 3006)) {
    $devPortMessage = "Frontend development port 3006 is already in use. Stop the running Vite service before dependency installation."
    if ($CheckOnly) { Write-Warn $devPortMessage } else { throw $devPortMessage }
  }
  else { Write-Pass "Frontend development port 3006 is available" }
}

if ($CheckOnly) {
  Write-Step "Read-only dependency inventory"
  $nodeCheck = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($nodeCheck) {
    $nodeCheckVersion = Get-CommandVersion "node.exe" @("--version")
    if ((Get-MajorVersion $nodeCheckVersion) -ge 20) { Write-Pass "Node.js $nodeCheckVersion" }
    else { Write-Warn "Node.js $nodeCheckVersion is below the required major version 20." }
  } else { Write-Warn "Node.js is not installed or is missing from PATH." }

  $npmCheck = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($npmCheck) { Write-Pass "npm $(Get-CommandVersion 'npm.cmd' @('--version'))" }
  else { Write-Warn "npm.cmd is not installed or is missing from PATH." }

  $pnpmCheck = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  if ($pnpmCheck) { Write-Pass "pnpm $(Get-CommandVersion 'pnpm.cmd' @('--version'))" }
  else { Write-Warn "pnpm is not installed; setup installs pnpm 10 automatically." }

  if (Test-Path -LiteralPath $ServerEnv) { Write-Pass "server/.env exists and remains untracked" }
  else { Write-Warn "server/.env is missing; setup will create it from .env.example." }
  if (Test-Path -LiteralPath (Join-Path $ServerDir "node_modules")) { Write-Pass "Backend node_modules exists" }
  else { Write-Warn "Backend dependencies are not installed." }
  if (Test-Path -LiteralPath (Join-Path $WebDir "node_modules")) { Write-Pass "Frontend node_modules exists" }
  else { Write-Warn "Frontend dependencies are not installed." }
  if (Test-Path -LiteralPath (Join-Path $WebDir "dist\index.html")) { Write-Pass "Production frontend build exists" }
  else { Write-Warn "Production frontend build is missing." }
  if (Test-Path -LiteralPath $DatabasePath) { Write-Pass "SQLite database exists" }
  else { Write-Warn "SQLite database is not initialized." }

  Write-Host "`nCheck-only mode completed. No software, dependencies, configuration, or data were changed." -ForegroundColor Cyan
  Write-Host "Warnings: $($script:Warnings.Count)"
  foreach ($warning in $script:Warnings) { Write-Host " - $warning" -ForegroundColor Yellow }
  return
}

Write-Step "Node.js and package manager checks"
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$nodeVersion = if ($nodeCommand) { Get-CommandVersion "node.exe" @("--version") } else { "" }
$nodeMajor = Get-MajorVersion $nodeVersion
if ($nodeMajor -lt 20) {
  Install-NodeLts
  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodeVersion = if ($nodeCommand) { Get-CommandVersion "node.exe" @("--version") } else { "" }
  $nodeMajor = Get-MajorVersion $nodeVersion
}
if ($nodeMajor -lt 20) { throw "Node.js 20+ is still unavailable. Open a new PowerShell window and rerun." }
if (-not [Environment]::Is64BitProcess) { throw "The active Node.js/PowerShell environment must be 64-bit." }
if (($nodeMajor % 2) -ne 0) { Write-Warn "Node.js $nodeVersion is a non-LTS odd major version. Node.js LTS is safer for better-sqlite3." }
else { Write-Pass "Node.js $nodeVersion" }

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw "npm.cmd was not installed with Node.js." }
$env:npm_config_registry = $NpmRegistry
if (-not $SkipNetworkCheck) { Invoke-Checked npm.cmd ping --registry $NpmRegistry }

if (-not (Get-Command pnpm.cmd -ErrorAction SilentlyContinue)) {
  Invoke-Checked npm.cmd install --global pnpm@10 --registry $NpmRegistry
  Refresh-ProcessPath
}
$pnpmVersion = Get-CommandVersion "pnpm.cmd" @("--version")
if ((Get-MajorVersion $pnpmVersion) -lt 9) { throw "pnpm 9+ is required; detected $pnpmVersion." }
Write-Pass "pnpm $pnpmVersion"

Write-Step "Environment configuration"
if (-not (Test-Path -LiteralPath $ServerEnv)) {
  Copy-Item -LiteralPath $ServerEnvExample -Destination $ServerEnv
  Write-Pass "Created server/.env from server/.env.example"
} else {
  Write-Pass "Preserving existing server/.env"
}
$jwtSecret = Get-DotEnvValue $ServerEnv "JWT_SECRET"
if ([string]::IsNullOrWhiteSpace($jwtSecret) -or $jwtSecret -in @("dev-secret", "replace-with-a-long-random-secret")) {
  Set-DotEnvValue -Path $ServerEnv -Name "JWT_SECRET" -Value (New-RandomSecret)
  Write-Pass "Generated a random JWT_SECRET"
}

if ($ConfigureCloudLlm) {
  $uri = $null
  if (-not [Uri]::TryCreate($LlmBaseUrl, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne "https") {
    throw "LlmBaseUrl must be an absolute HTTPS URL."
  }
  if ([string]::IsNullOrWhiteSpace($LlmModel)) { throw "LlmModel cannot be empty." }
  $secureKey = Read-Host "Enter the LLM API key (saved only to ignored server/.env)" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  try { $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  if ([string]::IsNullOrWhiteSpace($plainKey)) { throw "The LLM API key cannot be empty." }
  Set-DotEnvValue $ServerEnv "LLM_PROVIDER" "openai"
  Set-DotEnvValue $ServerEnv "LLM_API_KEY" $plainKey
  Set-DotEnvValue $ServerEnv "LLM_BASE_URL" $LlmBaseUrl.TrimEnd('/')
  Set-DotEnvValue $ServerEnv "LLM_MODEL" $LlmModel
  Set-DotEnvValue $ServerEnv "DEMO_MODE" "true"
  $plainKey = $null
  Write-Pass "Cloud LLM configuration saved for model '$LlmModel'"
  Write-Warn "The script does not make a paid model request. Verify the exact model ID with your provider before the competition."
} else {
  $provider = Get-DotEnvValue $ServerEnv "LLM_PROVIDER"
  if ($provider -eq "openai" -and [string]::IsNullOrWhiteSpace((Get-DotEnvValue $ServerEnv "LLM_API_KEY"))) {
    throw "server/.env selects the openai provider but LLM_API_KEY is empty. Use -ConfigureCloudLlm or set LLM_PROVIDER=mock."
  }
  Write-Pass "Existing LLM configuration preserved (provider: $provider)"
}

Write-Step "Dependency installation"
Backup-ExistingDatabase
Install-BackendDependencies
Push-Location $WebDir
try {
  Invoke-Checked pnpm.cmd install --frozen-lockfile --prefer-offline
} finally { Pop-Location }

Write-Step "Database initialization and boundary tests"
Push-Location $ServerDir
try {
  Invoke-Checked npm.cmd run db:init
  Invoke-Checked npm.cmd run check
  Invoke-Checked npm.cmd run env:check
  if (-not $SkipTests) {
    Invoke-Checked npm.cmd run test:db
    Invoke-Checked npm.cmd run test:retrieval
    Invoke-Checked npm.cmd run test:routes
    Invoke-Checked npm.cmd run test:digital-human
    Invoke-Checked npm.cmd run test:demo-mode
  } else {
    Write-Warn "Automated backend boundary tests were skipped."
  }
} finally { Pop-Location }

Write-Step "Frontend verification"
Push-Location $WebDir
try {
  Invoke-Checked pnpm.cmd run build
} finally { Pop-Location }
Write-Pass "Frontend type-check and production build"

Write-Step "Production smoke test"
$runningProcess = Start-SmokeTestServer -KeepRunning:$StartAfterInstall

Write-Host "`nSetup completed successfully." -ForegroundColor Green
Write-Host "Deployment mode: $Mode"
Write-Host "Warnings: $($script:Warnings.Count)"
foreach ($warning in $script:Warnings) { Write-Host " - $warning" -ForegroundColor Yellow }
Write-Host "`nImportant next steps:" -ForegroundColor Cyan
Write-Host "1. Do not commit or share server/.env."
Write-Host "2. Change the default admin password admin/admin123 before public deployment."
Write-Host "3. Configure and test iFlytek credentials on the target browser and network."
Write-Host "4. Run 'cd server; npm run backup' before recording or changing demo data."
if ($StartAfterInstall) {
  Write-Host "5. Open http://127.0.0.1:5178 (server PID $($runningProcess.Id))." -ForegroundColor Green
} elseif ($Mode -eq "Development") {
  Write-Host "5. Start backend: cd server; npm start"
  Write-Host "6. Start frontend in another terminal: cd web; pnpm dev"
} else {
  Write-Host "5. Start production: cd server; npm start"
  Write-Host "6. Open http://127.0.0.1:5178"
}
