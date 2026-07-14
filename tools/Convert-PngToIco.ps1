param(
    [Parameter(Mandatory = $true)]
    [string]$InputPng,

    [Parameter(Mandatory = $true)]
    [string]$OutputIco,

    [ValidateRange(16, 256)]
    [int]$Size = 256
)

$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeMethods {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool DestroyIcon(IntPtr hIcon);
}
"@

if (-not (Test-Path -LiteralPath $InputPng)) {
    throw "Input PNG not found: $InputPng"
}

Add-Type -AssemblyName System.Drawing

$inputImage = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $InputPng))

try {
    $sourceBitmap = New-Object System.Drawing.Bitmap($inputImage)
    try {
        $trimLeft = $sourceBitmap.Width
        $trimTop = $sourceBitmap.Height
        $trimRight = -1
        $trimBottom = -1

        for ($x = 0; $x -lt $sourceBitmap.Width; $x++) {
            for ($y = 0; $y -lt $sourceBitmap.Height; $y++) {
                $pixel = $sourceBitmap.GetPixel($x, $y)
                if ($pixel.A -gt 0) {
                    if ($x -lt $trimLeft) { $trimLeft = $x }
                    if ($y -lt $trimTop) { $trimTop = $y }
                    if ($x -gt $trimRight) { $trimRight = $x }
                    if ($y -gt $trimBottom) { $trimBottom = $y }
                }
            }
        }

        $croppedBitmap = $sourceBitmap
        if ($trimRight -ge $trimLeft -and $trimBottom -ge $trimTop) {
            $trimRectangle = [System.Drawing.Rectangle]::FromLTRB($trimLeft, $trimTop, $trimRight + 1, $trimBottom + 1)
            $croppedBitmap = $sourceBitmap.Clone($trimRectangle, $sourceBitmap.PixelFormat)
        }

        try {
            $canvas = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            try {
                $graphics = [System.Drawing.Graphics]::FromImage($canvas)
                try {
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                    $scale = [Math]::Min($Size / $croppedBitmap.Width, $Size / $croppedBitmap.Height)
                    $drawWidth = [Math]::Max(1, [int][Math]::Round($croppedBitmap.Width * $scale))
                    $drawHeight = [Math]::Max(1, [int][Math]::Round($croppedBitmap.Height * $scale))
                    $offsetX = [int](($Size - $drawWidth) / 2)
                    $offsetY = [int](($Size - $drawHeight) / 2)

                    $graphics.DrawImage($croppedBitmap, $offsetX, $offsetY, $drawWidth, $drawHeight)
                }
                finally {
                    $graphics.Dispose()
                }

                $iconHandle = $canvas.GetHicon()
                try {
                    $outputDirectory = Split-Path -Parent $OutputIco
                    if ($outputDirectory) {
                        New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
                    }

                    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
                    try {
                        $outputStream = [System.IO.File]::Create($OutputIco)
                        try {
                            $icon.Save($outputStream)
                        }
                        finally {
                            $outputStream.Dispose()
                        }
                    }
                    finally {
                        $icon.Dispose()
                    }
                }
                finally {
                    [void][NativeMethods]::DestroyIcon($iconHandle)
                }
            }
            finally {
                $canvas.Dispose()
            }
        }
        finally {
            if (-not [object]::ReferenceEquals($croppedBitmap, $sourceBitmap)) {
                $croppedBitmap.Dispose()
            }
        }
    }
    finally {
        $sourceBitmap.Dispose()
    }
}
finally {
    $inputImage.Dispose()
}