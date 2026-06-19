param(
  [Parameter(Mandatory=$true)]
  [string]$Task,

  [Parameter(Mandatory=$true)]
  [string]$CommitMessage,

  [Parameter(Mandatory=$true)]
  [string]$ExpectedAuditKey
)

$ErrorActionPreference = "Stop"

cd C:\Users\Owner\StudioProjects\honne_fortune

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logDir = ".\ash_dev_logs"
New-Item -ItemType Directory -Force $logDir | Out-Null

$logPath = Join-Path $logDir "$timestamp`_ash-dev.log"

"== Ash Development Runtime ==" | Set-Content $logPath -Encoding UTF8
"Task: $Task" | Add-Content $logPath -Encoding UTF8
"CommitMessage: $CommitMessage" | Add-Content $logPath -Encoding UTF8
"ExpectedAuditKey: $ExpectedAuditKey" | Add-Content $logPath -Encoding UTF8
"Timestamp: $timestamp" | Add-Content $logPath -Encoding UTF8
"" | Add-Content $logPath -Encoding UTF8

Write-Host "== Ash Development Runtime =="
Write-Host "Task: $Task"
Write-Host "ExpectedAuditKey: $ExpectedAuditKey"

"== git status before ==" | Add-Content $logPath -Encoding UTF8
git status 2>&1 | Tee-Object -FilePath $logPath -Append

"== checkpoint ==" | Add-Content $logPath -Encoding UTF8
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\runtime-checkpoint.ps1 `
  -CommitMessage $CommitMessage `
  -ExpectedAuditKey $ExpectedAuditKey 2>&1 | Tee-Object -FilePath $logPath -Append

if ($LASTEXITCODE -ne 0) {
  throw "runtime-checkpoint failed"
}

"== git status after ==" | Add-Content $logPath -Encoding UTF8
git status 2>&1 | Tee-Object -FilePath $logPath -Append

"== Ash Development Runtime complete ==" | Add-Content $logPath -Encoding UTF8

Write-Host "Ash Development Runtime complete."
Write-Host "Log: $logPath"
