param(
  [Parameter(Mandatory=$true)]
  [string]$CommitMessage,

  [Parameter(Mandatory=$true)]
  [string]$ExpectedAuditKey
)

$ErrorActionPreference = "Stop"

cd C:\Users\Owner\StudioProjects\honne_fortune

Write-Host "== node --check =="
node --check .\server\index.js
if ($LASTEXITCODE -ne 0) {
  throw "node --check failed"
}

Write-Host "== API audit check =="

$r = Invoke-RestMethod `
  -Method POST `
  -Uri "http://127.0.0.1:8787/deep-fortune" `
  -ContentType "application/json" `
  -Body '{
    "locale":"en",
    "score":12,
    "depth":"deep",
    "audit":true,
    "expectedQuestionCount":15,
    "answers":[
      {"questionKey":"q1","value":1},
      {"questionKey":"q2","value":1},
      {"questionKey":"q3","value":1}
    ],
    "previousPatterns":[
      {
        "responseStyle":"defensive",
        "opennessState":"guarded",
        "trustDepthState":"cautious",
        "silenceStyle":"partial_avoidance",
        "emotionTone":"low",
        "primaryTrait":"people_pleasing"
      }
    ]
  }'

$auditValue = $r.runtimeAudit.$ExpectedAuditKey

if ($null -eq $auditValue) {
  throw "Expected runtimeAudit key not found: $ExpectedAuditKey"
}

$auditValue | ConvertTo-Json -Depth 10

Write-Host "== git diff check =="
git diff --check
if ($LASTEXITCODE -ne 0) {
  throw "git diff --check failed"
}

Write-Host "== git status before commit =="
git status

Write-Host "== commit / push =="
git add .\server\index.js .\scripts\*.ps1

$pending = git status --porcelain
if ([string]::IsNullOrWhiteSpace($pending)) {
  Write-Host "No changes to commit. Skipping commit / push."
} else {
  git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed"
  }

  git push
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
}


Write-Host "== git status after push =="
git status

Write-Host "== checkpoint complete =="
