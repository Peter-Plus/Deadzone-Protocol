param([switch]$Replace, [string]$ManifestFile='generation.json', [string]$PreviewFile='preview.png', [string]$ValidationFile='validation.json')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$qa = $PSScriptRoot
$dest = [IO.Path]::GetFullPath((Join-Path $qa '../../icons/items'))
New-Item -ItemType Directory -Path $dest -Force | Out-Null
$items = Get-Content -LiteralPath (Join-Path $qa $ManifestFile) -Raw | ConvertFrom-Json
$report = @()
foreach ($item in $items) {
    $target = Join-Path $dest $item.file
    if ((Test-Path -LiteralPath $target) -and !$Replace) { throw "File exists: $target" }
    $src = [System.Drawing.Bitmap]::new($item.source)
    $dst = [System.Drawing.Bitmap]::new(512,512,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src,[System.Drawing.Rectangle]::new(26,26,460,460))
    $dst.Save($target,[System.Drawing.Imaging.ImageFormat]::Png)
    $borderMax = 0
    for ($n=0; $n -lt 512; $n++) {
        foreach ($a in @($dst.GetPixel($n,0).A,$dst.GetPixel($n,511).A,$dst.GetPixel(0,$n).A,$dst.GetPixel(511,$n).A)) { $borderMax = [Math]::Max($borderMax,$a) }
    }
    $report += [pscustomobject]@{file=$item.file;sourceSize=@($src.Width,$src.Height);size=@(512,512);format=$dst.PixelFormat.ToString();borderMaxAlpha=$borderMax;bytes=(Get-Item -LiteralPath $target).Length}
    $g.Dispose(); $dst.Dispose(); $src.Dispose()
}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $qa $ValidationFile) -Encoding utf8
$report | Format-Table file,format,borderMaxAlpha,bytes
$sheet = [System.Drawing.Bitmap]::new(($items.Count*200),430)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#17212B'))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = [System.Drawing.Font]::new('Microsoft YaHei',13)
$small = [System.Drawing.Font]::new('Arial',10)
for ($i=0; $i -lt $items.Count; $i++) {
    $im = [System.Drawing.Bitmap]::new((Join-Path $dest $items[$i].file))
    $x = 10 + $i*200
    $g.DrawString($items[$i].name,$font,[System.Drawing.Brushes]::White,$x,14)
    $g.DrawImage($im,[System.Drawing.Rectangle]::new($x,42,180,180))
    $g.DrawString('64px / 32px',$small,[System.Drawing.Brushes]::White,$x,230)
    $g.DrawImage($im,[System.Drawing.Rectangle]::new(($x+10),256,64,64))
    $g.DrawImage($im,[System.Drawing.Rectangle]::new(($x+118),272,32,32))
    $g.FillRectangle([System.Drawing.Brushes]::LightGray,$x,336,180,82)
    $g.DrawImage($im,[System.Drawing.Rectangle]::new(($x+10),345,64,64))
    $g.DrawImage($im,[System.Drawing.Rectangle]::new(($x+118),361,32,32))
    $im.Dispose()
}
$sheet.Save((Join-Path $qa $PreviewFile),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose(); $font.Dispose(); $small.Dispose()
