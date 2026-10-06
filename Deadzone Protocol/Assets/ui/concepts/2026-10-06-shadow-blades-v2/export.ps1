Add-Type -AssemblyName System.Drawing
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../icons/weapons'))
[IO.Directory]::CreateDirectory($root) | Out-Null
$sourceRoot = 'C:\Users\32430\.codex\generated_images\01a10cdc-3705-7e52-966c-f49bb0509b0b'
$entries = @(,@('exec-8da4a246-b02d-45c2-a65f-cad6ac9db469.png','ui_weapon_shadow_blades','Shadow Blades - V2',430))
$sheet = [Drawing.Bitmap]::new(1200,540)
$sg = [Drawing.Graphics]::FromImage($sheet)
$sg.Clear([Drawing.ColorTranslator]::FromHtml('#17212B'))
$font = [Drawing.Font]::new('Arial',18)
$small = [Drawing.Font]::new('Arial',10)
$i=0
foreach($entry in $entries) {
  $src = [Drawing.Bitmap]::new((Join-Path $sourceRoot $entry[0]))
  Copy-Item -LiteralPath (Join-Path $sourceRoot $entry[0]) -Destination (Join-Path $PSScriptRoot ($entry[1] + '_source.png'))
  $xmin=$src.Width; $ymin=$src.Height; $xmax=-1; $ymax=-1; $transparent=0
  for($y=0;$y -lt $src.Height;$y++){ for($x=0;$x -lt $src.Width;$x++){
    $a=$src.GetPixel($x,$y).A
    if($a -eq 0){$transparent++}
    if($a -gt 24){$xmin=[Math]::Min($xmin,$x);$ymin=[Math]::Min($ymin,$y);$xmax=[Math]::Max($xmax,$x);$ymax=[Math]::Max($ymax,$y)}
  }}
  if($transparent -eq 0){throw 'Source lacks transparent pixels'}
  $w=$xmax-$xmin+1; $h=$ymax-$ymin+1
  $out=[Drawing.Bitmap]::new(512,512,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[Drawing.Graphics]::FromImage($out)
  $g.Clear([Drawing.Color]::Transparent)
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scale=[double]$entry[3]/[Math]::Max($w,$h); $dw=[int][Math]::Round($w*$scale); $dh=[int][Math]::Round($h*$scale)
  $g.DrawImage($src,[Drawing.Rectangle]::new([int]((512-$dw)/2),[int]((512-$dh)/2),$dw,$dh),$xmin,$ymin,$w,$h,[Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $dest=Join-Path $root ($entry[1]+'.png')
  $out.Save($dest,[Drawing.Imaging.ImageFormat]::Png)
  $sg.DrawString($entry[2],$font,[Drawing.Brushes]::White,(($i%3)*400+30),([int][Math]::Floor($i/3)*540+20))
  $sg.DrawImage($out,[Drawing.Rectangle]::new(($i%3)*400,([int][Math]::Floor($i/3)*540+50),400,400))
  $sg.DrawImage($out,[Drawing.Rectangle]::new(($i%3)*400+70,([int][Math]::Floor($i/3)*540+450),64,64))
  $sg.DrawImage($out,[Drawing.Rectangle]::new(($i%3)*400+190,([int][Math]::Floor($i/3)*540+466),32,32))
  $sg.DrawString('64px',$small,[Drawing.Brushes]::LightGray,(($i%3)*400+140),([int][Math]::Floor($i/3)*540+477))
  $sg.DrawString('32px',$small,[Drawing.Brushes]::LightGray,(($i%3)*400+230),([int][Math]::Floor($i/3)*540+477))
  Write-Output "$($entry[1]): source $($src.Width)x$($src.Height), alpha bounds $xmin,$ymin,$w,$h; final 512x512 RGBA, subject ${dw}x$dh"
  $src.Dispose();$out.Dispose();$i++
}
$sg.Dispose();$font.Dispose();$small.Dispose()
$sheet.Save((Join-Path $PSScriptRoot 'preview.png'),[Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
