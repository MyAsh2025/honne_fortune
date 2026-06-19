param(
  [Parameter(Mandatory=$true)]
  [string]$TargetFile,

  [Parameter(Mandatory=$true)]
  [string]$Anchor,

  [Parameter(Mandatory=$true)]
  [ValidateSet("before","after")]
  [string]$Position,

  [Parameter(Mandatory=$true)]
  [string]$PatchFile,

  [string]$LogName = "runtime-safe-patch"
)

$ErrorActionPreference = "Stop"

cd C:\Users\Owner\StudioProjects\honne_fortune

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logDir = ".\runtime_patch_logs"
$backupDir = ".\runtime_patch_backups"

New-Item -ItemType Directory -Force $logDir | Out-Null
New-Item -ItemType Directory -Force $backupDir | Out-Null

$logPath = Join-Path $logDir "$timestamp`_$LogName.log"
$backupPath = Join-Path $backupDir "$timestamp`_$(Split-Path $TargetFile -Leaf).bak"

if (-not (Test-Path $TargetFile)) {
  throw "Target file not found: $TargetFile"
}

if (-not (Test-Path $PatchFile)) {
  throw "Patch file not found: $PatchFile"
}

$lines = Get-Content $TargetFile -Encoding UTF8
$patchLines = Get-Content $PatchFile -Encoding UTF8

$matches = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i].Contains($Anchor)) {
    $matches += $i
  }
}

if ($matches.Count -eq 0) {
  throw "Anchor not found: $Anchor"
}

if ($matches.Count -gt 1) {
  throw "Anchor is not unique. Count: $($matches.Count)"
}

$anchorIndex = $matches[0]

Copy-Item $TargetFile $backupPath -Force

$contextStart = [Math]::Max(0, $anchorIndex - 8)
$contextEnd = [Math]::Min($lines.Count - 1, $anchorIndex + 8)

"TargetFile: $TargetFile" | Set-Content $logPath -Encoding UTF8
"PatchFile: $PatchFile" | Add-Content $logPath -Encoding UTF8
"Anchor: $Anchor" | Add-Content $logPath -Encoding UTF8
"Position: $Position" | Add-Content $logPath -Encoding UTF8
"AnchorLine: $($anchorIndex + 1)" | Add-Content $logPath -Encoding UTF8
"Backup: $backupPath" | Add-Content $logPath -Encoding UTF8
"" | Add-Content $logPath -Encoding UTF8

"== BEFORE CONTEXT ==" | Add-Content $logPath -Encoding UTF8
for ($i = $contextStart; $i -le $contextEnd; $i++) {
  "$($i + 1): $($lines[$i])" | Add-Content $logPath -Encoding UTF8
}

if ($Position -eq "before") {
  $before = if ($anchorIndex -gt 0) { $lines[0..($anchorIndex - 1)] } else { @() }
  $after = $lines[$anchorIndex..($lines.Count - 1)]
} else {
  $before = $lines[0..$anchorIndex]
  $after = if ($anchorIndex + 1 -lt $lines.Count) { $lines[($anchorIndex + 1)..($lines.Count - 1)] } else { @() }
}

$updated = @(
  $before
  $patchLines
  $after
)

Set-Content $TargetFile $updated -Encoding UTF8

$updatedLines = Get-Content $TargetFile -Encoding UTF8
$afterContextStart = [Math]::Max(0, $anchorIndex - 8)
$afterContextEnd = [Math]::Min($updatedLines.Count - 1, $anchorIndex + $patchLines.Count + 8)

"" | Add-Content $logPath -Encoding UTF8
"== AFTER CONTEXT ==" | Add-Content $logPath -Encoding UTF8
for ($i = $afterContextStart; $i -le $afterContextEnd; $i++) {
  "$($i + 1): $($updatedLines[$i])" | Add-Content $logPath -Encoding UTF8
}

"" | Add-Content $logPath -Encoding UTF8
"== node --check ==" | Add-Content $logPath -Encoding UTF8

node --check .\server\index.js 2>&1 | Tee-Object -FilePath $logPath -Append

if ($LASTEXITCODE -ne 0) {
  Copy-Item $backupPath $TargetFile -Force
  throw "node --check failed. Restored backup: $backupPath"
}

"Patch complete." | Add-Content $logPath -Encoding UTF8

Write-Host "Patch complete."
Write-Host "Log: $logPath"
Write-Host "Backup: $backupPath"
