Add-Type -AssemblyName System.Drawing

$dir = 'D:\repos\classic-honeypot-for-cf7\assets'
New-Item -ItemType Directory -Force $dir | Out-Null

$images = @(
	@{ Name = 'icon-128x128.png';    W = 128;  H = 128 },
	@{ Name = 'icon-256x256.png';    W = 256;  H = 256 },
	@{ Name = 'banner-772x250.png';  W = 772;  H = 250 },
	@{ Name = 'banner-1544x500.png'; W = 1544; H = 500 }
)

foreach ( $img in $images ) {
	$bmp = New-Object System.Drawing.Bitmap $img.W, $img.H
	$g   = [System.Drawing.Graphics]::FromImage( $bmp )
	$g.SmoothingMode     = 'AntiAlias'
	$g.TextRenderingHint = 'AntiAlias'
	$g.Clear( [System.Drawing.Color]::FromArgb( 240, 176, 32 ) )

	$text     = "PLACEHOLDER`n$($img.W)x$($img.H)"
	$fontSize = [Math]::Max( 10, [Math]::Min( $img.W, $img.H ) / 8 )
	$font     = New-Object System.Drawing.Font 'Segoe UI', $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
	$format   = New-Object System.Drawing.StringFormat
	$format.Alignment     = 'Center'
	$format.LineAlignment = 'Center'
	$rect = New-Object System.Drawing.RectangleF 0, 0, $img.W, $img.H
	$g.DrawString( $text, $font, [System.Drawing.Brushes]::Black, $rect, $format )

	$bmp.Save( (Join-Path $dir $img.Name), [System.Drawing.Imaging.ImageFormat]::Png )
	$g.Dispose()
	$bmp.Dispose()
}

Get-ChildItem $dir | ForEach-Object {
	$i = [System.Drawing.Image]::FromFile( $_.FullName )
	'{0,-22} {1}x{2}' -f $_.Name, $i.Width, $i.Height
	$i.Dispose()
}
