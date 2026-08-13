param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("install", "dev", "build", "test", "typecheck", "verify", "supabase-push", "status")]
  [string]$Task
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$nodeBin = "C:\Users\edhem\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$node = Join-Path $nodeBin "node.exe"
$pnpm = "C:\Users\edhem\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$supabaseGo = Join-Path $repo ".supabase-cli\supabase-go.exe"

if (Test-Path $nodeBin) {
  $env:PATH = "$nodeBin;$env:PATH"
}
if (Test-Path $supabaseGo) {
  $env:SUPABASE_GO_BINARY = $supabaseGo
}

Set-Location $repo

function Invoke-BrixCommand {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "BRIX command failed with exit code $LASTEXITCODE."
  }
}

switch ($Task) {
  "install" { Invoke-BrixCommand { & $pnpm install } }
  "dev" { Invoke-BrixCommand { & $node "node_modules\vite\bin\vite.js" } }
  "build" { Invoke-BrixCommand { & $node "node_modules\vite\bin\vite.js" build } }
  "test" { Invoke-BrixCommand { & $node "node_modules\vitest\vitest.mjs" run --environment jsdom --config vitest.config.ts } }
  "typecheck" { Invoke-BrixCommand { & $node "node_modules\typescript\bin\tsc" -p tsconfig.app.json --noEmit } }
  "verify" {
    Invoke-BrixCommand { & $node "node_modules\typescript\bin\tsc" -p tsconfig.app.json --noEmit }
    Invoke-BrixCommand { & $node "node_modules\eslint\bin\eslint.js" . }
    Invoke-BrixCommand { & $node "scripts\production-authority-check.mjs" }
    if (-not (Test-Path $pnpm)) {
      throw "pnpm.cmd was not found in the configured BRIX package runtime."
    }
    Invoke-BrixCommand { & $pnpm audit --prod --audit-level high }
    Invoke-BrixCommand { & $node "node_modules\vitest\vitest.mjs" run --environment jsdom --config vitest.config.ts }
    Invoke-BrixCommand { & $node "node_modules\vite\bin\vite.js" build }
  }
  "supabase-push" { Invoke-BrixCommand { supabase db push } }
  "status" {
    Write-Host "Repo: $repo"
    Write-Host "Node:" (Get-Command node -ErrorAction SilentlyContinue).Source
    Write-Host "npm:" (Get-Command npm -ErrorAction SilentlyContinue).Source
    Write-Host "Supabase:" (Get-Command supabase -ErrorAction SilentlyContinue).Source
    git status --short
  }
}
