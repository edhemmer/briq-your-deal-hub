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

switch ($Task) {
  "install" { & $pnpm install }
  "dev" { & $node "node_modules\vite\bin\vite.js" }
  "build" { & $node "node_modules\vite\bin\vite.js" build }
  "test" { & $node "node_modules\vitest\vitest.mjs" run --environment jsdom --config vitest.config.ts }
  "typecheck" { & $node "node_modules\typescript\bin\tsc" -p tsconfig.app.json --noEmit }
  "verify" {
    & $node "node_modules\typescript\bin\tsc" -p tsconfig.app.json --noEmit
    & $node "node_modules\vitest\vitest.mjs" run --environment jsdom --config vitest.config.ts
    & $node "node_modules\vite\bin\vite.js" build
  }
  "supabase-push" { supabase db push }
  "status" {
    Write-Host "Repo: $repo"
    Write-Host "Node:" (Get-Command node -ErrorAction SilentlyContinue).Source
    Write-Host "npm:" (Get-Command npm -ErrorAction SilentlyContinue).Source
    Write-Host "Supabase:" (Get-Command supabase -ErrorAction SilentlyContinue).Source
    git status --short
  }
}
