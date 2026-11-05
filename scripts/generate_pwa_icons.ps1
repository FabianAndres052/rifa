Add-Type -AssemblyName System.Drawing

New-Item -ItemType Directory -Force -Path "public\icons" | Out-Null

function Generate-Icon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$isMaskable
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Dark Zinc Background #09090b
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 9, 9, 11))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Margins and safe zone
    $pad = if ($isMaskable) { [int]($size * 0.16) } else { [int]($size * 0.08) }
    $cardSize = $size - ($pad * 2)

    # Card Plate with Rounded Corners
    $rect = New-Object System.Drawing.Rectangle($pad, $pad, $cardSize, $cardSize)
    $radius = [int]($cardSize * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    # Plate fill #18181b
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
    $g.FillPath($cardBrush, $path)

    # Border #3f3f46
    $penWidth = [Math]::Max(1.0, [float]($size * 0.012))
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 63, 63, 70), $penWidth)
    $g.DrawPath($cardPen, $path)

    # Monogram "SR" (Super Rifa)
    $fontSize = [float]($cardSize * 0.38)
    $fontFamily = New-Object System.Drawing.FontFamily("Arial")
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF([float]$pad, [float]($pad - ($cardSize * 0.05)), [float]$cardSize, [float]$cardSize)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 244, 245))
    $g.DrawString("SR", $font, $textBrush, $textRect, $sf)

    # Accent Dot in Gold #f59e0b
    $dotSize = [int]($cardSize * 0.10)
    $dotX = [int]($size * 0.5 - ($dotSize / 2))
    $dotY = [int]($pad + ($cardSize * 0.74))
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
    $g.FillEllipse($dotBrush, $dotX, $dotY, $dotSize, $dotSize)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $textBrush.Dispose()
    $dotBrush.Dispose()
    $font.Dispose()
    $fontFamily.Dispose()
    $cardPen.Dispose()
    $cardBrush.Dispose()
    $path.Dispose()
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

Generate-Icon 512 "public\icons\icon-512x512.png" $false
Generate-Icon 192 "public\icons\icon-192x192.png" $false
Generate-Icon 512 "public\icons\icon-maskable-512x512.png" $true
Generate-Icon 180 "public\icons\apple-touch-icon.png" $false

Write-Output "ALL_ICONS_GENERATED"
