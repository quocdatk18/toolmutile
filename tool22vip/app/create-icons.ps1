# Script to create extension icons from source image
# Usage: .\create-icons.ps1 source-icon.png

param(
    [string]$SourceImage = "source-icon.png"
)

if (-not (Test-Path $SourceImage)) {
    Write-Host "Error: Source image '$SourceImage' not found!" -ForegroundColor Red
    Write-Host "Please save your image as 'source-icon.png' in this folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creating extension icons from $SourceImage..." -ForegroundColor Green

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Load source image
$sourceImg = [System.Drawing.Image]::FromFile((Resolve-Path $SourceImage))

# Function to resize and save image
function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # High quality resize
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "  Created: $OutputPath ($Width x $Height)" -ForegroundColor Cyan
}

# Create icons
Resize-Image -Image $sourceImg -Width 16 -Height 16 -OutputPath "icon16.png"
Resize-Image -Image $sourceImg -Width 48 -Height 48 -OutputPath "icon48.png"
Resize-Image -Image $sourceImg -Width 128 -Height 128 -OutputPath "icon128.png"

$sourceImg.Dispose()

Write-Host "`nDone! Icons created successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - icon16.png" -ForegroundColor White
Write-Host "  - icon48.png" -ForegroundColor White
Write-Host "  - icon128.png" -ForegroundColor White
