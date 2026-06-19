param(
  [string]$Intent = "general",
  [switch]$BeforePatch,
  [switch]$BeforeCheckpoint,
  [switch]$BeforeGit,
  [switch]$BeforeHandover,
  [switch]$ArchitectureChange,
  [switch]$RuntimeChange,
  [switch]$SaveRequired
)

Write-Host ""
Write-Host "=== Ash CoreCheck Runtime v2 ==="
Write-Host "Intent: $Intent"
Write-Host ""

$failed = $false

function Run-Check {
  param(
    [string]$Name,
    [scriptblock]$Block
  )

  Write-Host "---- $Name ----"

  try {
    & $Block
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "[OK] $Name"
  } catch {
    Write-Host "[FAIL] $Name"
    Write-Host $_
    $script:failed = $true
  }

  Write-Host ""
}

Run-Check "Git status" {
  git status --short
}

if ($BeforePatch -or $BeforeCheckpoint -or $BeforeGit -or $RuntimeChange) {
  Run-Check "Node syntax check" {
    node --check .\server\index.js
  }
}

if ($BeforeGit -or $BeforeCheckpoint) {
  Run-Check "Git diff whitespace check" {
    git diff --check
  }
}

if ($ArchitectureChange -or $RuntimeChange -or $SaveRequired) {
  Write-Host "---- Save classification ----"
  Write-Host "Ash_Core save check: REQUIRED when architecture/runtime/company direction changed."
  Write-Host "Memory save check: REQUIRED when long-term user preference or operating rule changed."
  Write-Host "Handover check: REQUIRED when session state or next-step continuity changed."
  Write-Host "[INFO] Manual classification still required in v2.0."
  Write-Host ""
}

if ($BeforePatch) {
  Write-Host "---- Patch safety gate ----"
  Write-Host "Anchor verification: REQUIRED before patch."
  Write-Host "Backup: REQUIRED before patch."
  Write-Host "After-context verification: REQUIRED after patch."
  Write-Host "[INFO] Use runtime-safe-patch.ps1 for actual patch execution."
  Write-Host ""
}

if ($BeforeHandover) {
  Write-Host "---- Handover gate ----"
  Write-Host "Check latest git commit."
  Write-Host "Check working tree clean."
  Write-Host "Check saved architecture/runtime decisions."
  Write-Host "Generate copy-paste handover."
  Write-Host ""
}

if ($failed) {
  Write-Host "=== CoreCheck Result: FAILED ==="
  exit 1
}

Write-Host "=== CoreCheck Result: OK ==="
exit 0
