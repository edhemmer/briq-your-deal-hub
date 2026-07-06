Add-Type -AssemblyName System.Drawing

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../../..')
$SourceIcon = Join-Path $RepoRoot 'ios/BRIXRealEstateiOS/BRIX-AppIcon-1024.png'
$OutRoot = Join-Path $RepoRoot 'ios/BRIXRealEstateiOS/ManualDropInAssets'
$IconOut = Join-Path $OutRoot 'AppIcon-iOS'
$ShotOut = Join-Path $OutRoot 'AppStoreScreenshots'

New-Item -ItemType Directory -Force -Path $IconOut, $ShotOut | Out-Null

function New-Brush($Hex) {
  $Hex = $Hex.TrimStart('#')
  return New-Object System.Drawing.SolidBrush(
    [System.Drawing.Color]::FromArgb(
      [Convert]::ToInt32($Hex.Substring(0, 2), 16),
      [Convert]::ToInt32($Hex.Substring(2, 2), 16),
      [Convert]::ToInt32($Hex.Substring(4, 2), 16)
    )
  )
}

function New-Pen($Hex, $Width = 1) {
  $Hex = $Hex.TrimStart('#')
  return New-Object System.Drawing.Pen(
    [System.Drawing.Color]::FromArgb(
      [Convert]::ToInt32($Hex.Substring(0, 2), 16),
      [Convert]::ToInt32($Hex.Substring(2, 2), 16),
      [Convert]::ToInt32($Hex.Substring(4, 2), 16)
    ),
    $Width
  )
}

function New-AppFont($Size, $Style = 'Regular') {
  return New-Object System.Drawing.Font('Segoe UI', $Size, ([System.Drawing.FontStyle]::$Style), [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-ResizedPngNoAlpha($Src, $Dest, [int]$Width, [int]$Height) {
  $Image = [System.Drawing.Image]::FromFile($Src)
  try {
    $Bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.Clear([System.Drawing.Color]::FromArgb(7, 14, 29))
    $Graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $Graphics.Dispose()
    $Bitmap.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $Bitmap.Dispose()
  } finally {
    $Image.Dispose()
  }
}

function Fill-RoundedRect($Graphics, $Brush, [float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius) {
  $Path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $Diameter = $Radius * 2
  $Path.AddArc($X, $Y, $Diameter, $Diameter, 180, 90)
  $Path.AddArc($X + $Width - $Diameter, $Y, $Diameter, $Diameter, 270, 90)
  $Path.AddArc($X + $Width - $Diameter, $Y + $Height - $Diameter, $Diameter, $Diameter, 0, 90)
  $Path.AddArc($X, $Y + $Height - $Diameter, $Diameter, $Diameter, 90, 90)
  $Path.CloseFigure()
  $Graphics.FillPath($Brush, $Path)
  $Path.Dispose()
}

function Stroke-RoundedRect($Graphics, $Pen, [float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius) {
  $Path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $Diameter = $Radius * 2
  $Path.AddArc($X, $Y, $Diameter, $Diameter, 180, 90)
  $Path.AddArc($X + $Width - $Diameter, $Y, $Diameter, $Diameter, 270, 90)
  $Path.AddArc($X + $Width - $Diameter, $Y + $Height - $Diameter, $Diameter, $Diameter, 0, 90)
  $Path.AddArc($X, $Y + $Height - $Diameter, $Diameter, $Diameter, 90, 90)
  $Path.CloseFigure()
  $Graphics.DrawPath($Pen, $Path)
  $Path.Dispose()
}

function Draw-Text($Graphics, $Text, $Font, $Brush, [float]$X, [float]$Y, [float]$Width, [float]$Height) {
  $Format = New-Object System.Drawing.StringFormat
  $Format.Trimming = [System.Drawing.StringTrimming]::Word
  $Rectangle = New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)
  $Graphics.DrawString($Text, $Font, $Brush, $Rectangle, $Format)
  $Format.Dispose()
}

function New-AppStoreScreenshot($Dest, [int]$Width, [int]$Height, [string]$Mode) {
  $Bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $Panel = New-Brush '#0B1426'
  $Card = New-Brush '#111D33'
  $White = New-Brush '#F8FBFF'
  $Muted = New-Brush '#90A8C8'
  $Blue = New-Brush '#3B82F6'
  $Green = New-Brush '#20E18A'
  $Border = New-Pen '#1E3354' 3

  $Graphics.Clear([System.Drawing.Color]::FromArgb(7, 14, 29))

  $Pad = [Math]::Round($Width * 0.07)
  $Top = [Math]::Round($Height * 0.055)
  $Headline = switch ($Mode) {
    'find' { 'Find opportunities faster' }
    'deal' { 'Underwrite with confidence' }
    default { 'Move every deal forward' }
  }
  $Subhead = switch ($Mode) {
    'find' { 'Start with a location, add a listing, import a file, or connect future listing feeds.' }
    'deal' { 'See required inputs, assumptions, risks, and next actions before committing capital.' }
    default { 'Track active opportunities, offers, due diligence, closing tasks, and portfolio handoff.' }
  }
  $Title = switch ($Mode) {
    'find' { 'FindIQ intake' }
    'deal' { 'DealIQ cockpit' }
    default { 'Deal Dashboard' }
  }
  $Items = switch ($Mode) {
    'find' { @('Search a city, ZIP, county, or state', 'Paste a listing URL or listing text', 'Upload screenshots, XLS files, or photos', 'Rank only properties in your workspace') }
    'deal' { @('Property facts and financial assumptions', 'Rent, insurance, tax, rehab, and financing inputs', 'Base, conservative, and stress-case analysis', 'Recommendation stays provisional until verified') }
    default { @('Review what needs attention now', 'Move from analysis to offer and due diligence', 'Keep notes, tasks, documents, and status together', 'Send closed assets into PortfolioIQ') }
  }
  $Footer = switch ($Mode) {
    'find' { 'Provider-ready architecture: manual today, live feeds when connected.' }
    'deal' { 'Clear output: recommendation, evidence, risks, confidence, and next actions.' }
    default { 'One property record follows the deal from discovery to ownership.' }
  }

  Draw-Text $Graphics 'BRIX REAL ESTATE' (New-AppFont ([Math]::Round($Width * 0.032)) 'Bold') $White $Pad $Top ($Width - $Pad * 2) 80
  Draw-Text $Graphics $Headline (New-AppFont ([Math]::Round($Width * 0.047)) 'Bold') $White $Pad ($Top + 105) ($Width - $Pad * 2) 125
  Draw-Text $Graphics $Subhead (New-AppFont ([Math]::Round($Width * 0.023))) $Muted $Pad ($Top + 245) ($Width - $Pad * 2) 140

  $PanelY = $Top + [Math]::Round($Height * 0.245)
  $PanelHeight = [Math]::Round($Height * 0.54)
  Fill-RoundedRect $Graphics $Panel $Pad $PanelY ($Width - $Pad * 2) $PanelHeight 28
  Stroke-RoundedRect $Graphics $Border $Pad $PanelY ($Width - $Pad * 2) $PanelHeight 28

  Draw-Text $Graphics $Title (New-AppFont ([Math]::Round($Width * 0.034)) 'Bold') $White ($Pad + 45) ($PanelY + 55) ($Width - $Pad * 2 - 90) 78

  $RowY = $PanelY + 175
  $RowHeight = [Math]::Round($Height * 0.068)
  foreach ($Item in $Items) {
    Fill-RoundedRect $Graphics $Card ($Pad + 45) $RowY ($Width - $Pad * 2 - 90) $RowHeight 22
    Fill-RoundedRect $Graphics $Blue ($Pad + 78) ($RowY + ($RowHeight / 2) - 18) 36 36 18
    Draw-Text $Graphics $Item (New-AppFont ([Math]::Round($Width * 0.023)) 'Bold') $White ($Pad + 140) ($RowY + ($RowHeight * 0.28)) ($Width - $Pad * 2 - 220) 72
    $RowY += $RowHeight + 34
  }

  Fill-RoundedRect $Graphics $Card ($Pad + 45) ($PanelY + $PanelHeight - 205) ($Width - $Pad * 2 - 90) 125 22
  Draw-Text $Graphics $Footer (New-AppFont ([Math]::Round($Width * 0.021)) 'Bold') $Green ($Pad + 80) ($PanelY + $PanelHeight - 165) ($Width - $Pad * 2 - 160) 80

  $Bitmap.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $Graphics.Dispose()
  $Bitmap.Dispose()
}

$IconSpecs = @(
  @{Name = 'AppIcon-iPhone-20pt@2x-40.png'; Size = 40 },
  @{Name = 'AppIcon-iPhone-20pt@3x-60.png'; Size = 60 },
  @{Name = 'AppIcon-iPhone-29pt@2x-58.png'; Size = 58 },
  @{Name = 'AppIcon-iPhone-29pt@3x-87.png'; Size = 87 },
  @{Name = 'AppIcon-iPhone-40pt@2x-80.png'; Size = 80 },
  @{Name = 'AppIcon-iPhone-40pt@3x-120.png'; Size = 120 },
  @{Name = 'AppIcon-iPhone-60pt@2x-120.png'; Size = 120 },
  @{Name = 'AppIcon-iPhone-60pt@3x-180.png'; Size = 180 },
  @{Name = 'AppIcon-iPad-20pt@1x-20.png'; Size = 20 },
  @{Name = 'AppIcon-iPad-20pt@2x-40.png'; Size = 40 },
  @{Name = 'AppIcon-iPad-29pt@1x-29.png'; Size = 29 },
  @{Name = 'AppIcon-iPad-29pt@2x-58.png'; Size = 58 },
  @{Name = 'AppIcon-iPad-40pt@1x-40.png'; Size = 40 },
  @{Name = 'AppIcon-iPad-40pt@2x-80.png'; Size = 80 },
  @{Name = 'AppIcon-iPad-76pt@1x-76.png'; Size = 76 },
  @{Name = 'AppIcon-iPad-76pt@2x-152.png'; Size = 152 },
  @{Name = 'AppIcon-iPad-83.5pt@2x-167.png'; Size = 167 },
  @{Name = 'AppIcon-AppStore-1024.png'; Size = 1024 }
)

foreach ($Spec in $IconSpecs) {
  Save-ResizedPngNoAlpha $SourceIcon (Join-Path $IconOut $Spec.Name) $Spec.Size $Spec.Size
}

$ScreenshotSpecs = @(
  @{Name = 'iPhone-6-9-01-FindIQ.png'; Width = 1290; Height = 2796; Mode = 'find' },
  @{Name = 'iPhone-6-9-02-DealIQ.png'; Width = 1290; Height = 2796; Mode = 'deal' },
  @{Name = 'iPhone-6-9-03-Deal-Dashboard.png'; Width = 1290; Height = 2796; Mode = 'dash' },
  @{Name = 'iPhone-6-5-01-FindIQ.png'; Width = 1242; Height = 2688; Mode = 'find' },
  @{Name = 'iPhone-6-5-02-DealIQ.png'; Width = 1242; Height = 2688; Mode = 'deal' },
  @{Name = 'iPhone-6-5-03-Deal-Dashboard.png'; Width = 1242; Height = 2688; Mode = 'dash' },
  @{Name = 'iPad-13-01-FindIQ.png'; Width = 2064; Height = 2752; Mode = 'find' },
  @{Name = 'iPad-13-02-DealIQ.png'; Width = 2064; Height = 2752; Mode = 'deal' },
  @{Name = 'iPad-13-03-Deal-Dashboard.png'; Width = 2064; Height = 2752; Mode = 'dash' },
  @{Name = 'iPad-12-9-01-FindIQ.png'; Width = 2048; Height = 2732; Mode = 'find' },
  @{Name = 'iPad-12-9-02-DealIQ.png'; Width = 2048; Height = 2732; Mode = 'deal' },
  @{Name = 'iPad-12-9-03-Deal-Dashboard.png'; Width = 2048; Height = 2732; Mode = 'dash' }
)

foreach ($Spec in $ScreenshotSpecs) {
  New-AppStoreScreenshot (Join-Path $ShotOut $Spec.Name) $Spec.Width $Spec.Height $Spec.Mode
}

Get-ChildItem -Recurse -File $OutRoot | Select-Object FullName, Length
