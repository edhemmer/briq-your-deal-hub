$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$nodeBin = "C:\Users\edhem\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$supabaseGo = Join-Path $repo ".supabase-cli\supabase-go.exe"

if (Test-Path $nodeBin) {
  $env:PATH = "$nodeBin;$env:PATH"
}

$checks = @(
  @{ Name = "git"; Command = "git" },
  @{ Name = "node"; Command = "node" },
  @{ Name = "pnpm-fallback"; Path = "C:\Users\edhem\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" },
  @{ Name = "supabase"; Command = "supabase" },
  @{ Name = "supabase-go"; Path = $supabaseGo }
)

foreach ($check in $checks) {
  if ($check.Path) {
    if (Test-Path $check.Path) {
      Write-Host "[ok] $($check.Name): $($check.Path)"
    } else {
      Write-Host "[missing] $($check.Name): $($check.Path)"
    }
    continue
  }
  $cmd = Get-Command $check.Command -ErrorAction SilentlyContinue
  if ($cmd) {
    Write-Host "[ok] $($check.Name): $($cmd.Source)"
  } else {
    Write-Host "[missing] $($check.Name)"
  }
}
