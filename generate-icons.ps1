Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\Marcos\.gemini\antigravity-ide\scratch\smart-shopping-list\icons"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

function MakeAppIcon($size, $filename) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $rectF = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    
    # Modern Indigo/Purple Gradient Background
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(79, 70, 229), [System.Drawing.Color]::FromArgb(124, 58, 237), 45)
    $g.FillRectangle($brush, $rect)
    
    # Shopping Bag / Cart Emoji Icon
    $fontSize = [float]($size * 0.48)
    $font = New-Object System.Drawing.Font('Segoe UI Emoji', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $g.DrawString("🛍️", $font, [System.Drawing.Brushes]::White, $rectF, $sf)
    
    $outPath = Join-Path $dir $filename
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Icon created: $filename"
}

MakeAppIcon 192 "icon-192.png"
MakeAppIcon 512 "icon-512.png"
MakeAppIcon 180 "apple-touch-icon.png"
