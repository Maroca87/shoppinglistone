Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Marcos\.gemini\antigravity-ide\brain\06ac8aeb-3875-49f2-8388-7ba34918938b\smart_shop_pwa_icon_1785466966965.png"
$outDir = "C:\Users\Marcos\.gemini\antigravity-ide\scratch\smart-shopping-list\icons"

function CopyResize($src, $size, $filename) {
    $srcImg = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $srcImg.Dispose()
    
    $outPath = Join-Path $outDir $filename
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Resized and saved $filename ($size x $size)"
}

CopyResize $srcPath 512 "icon-512.png"
CopyResize $srcPath 192 "icon-192.png"
CopyResize $srcPath 180 "apple-touch-icon.png"
