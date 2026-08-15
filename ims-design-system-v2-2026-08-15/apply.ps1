param(
  [Parameter(Mandatory=$true)][string]$Repo,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$BundleDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Expected = (Get-Content -LiteralPath (Join-Path $BundleDir "BASE_SHA.txt") -Raw).Trim()
$RepoPath = (Resolve-Path -LiteralPath $Repo).Path

Push-Location $RepoPath
try {
  if (-not (Test-Path -LiteralPath ".git")) {
    throw "Not a Git checkout: $RepoPath"
  }

  $HeadSha = (git rev-parse HEAD).Trim()
  if (($HeadSha -ne $Expected) -and (-not $Force)) {
    throw "Repo HEAD is $HeadSha, but this bundle was prepared against $Expected. Review the divergence, then rerun with -Force if intentional."
  }

  $Files = Get-Content -LiteralPath (Join-Path $BundleDir "FILES.txt")
  foreach ($File in $Files) {
    if ([string]::IsNullOrWhiteSpace($File)) { continue }
    $Source = Join-Path (Join-Path $BundleDir "overlay") $File
    $Destination = Join-Path $RepoPath $File
    $Parent = Split-Path -Parent $Destination
    if (-not (Test-Path -LiteralPath $Parent)) {
      New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    }
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
  }

  Write-Host ""
  Write-Host "Design System V2 overlay applied. Review before committing:"
  git status --short
}
finally {
  Pop-Location
}
