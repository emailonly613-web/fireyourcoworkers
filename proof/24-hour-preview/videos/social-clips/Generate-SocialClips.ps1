[CmdletBinding()]
param(
    [ValidateSet(
        "all",
        "01-printer-leaves-one-tile",
        "02-ceo-pinned-against-glass",
        "03-intern-rotated-wrong",
        "04-hr-99-to-lawsuit",
        "05-perfect-last-second-fit",
        "06-obvious-mistake-left-unfixed",
        "07-printer-paper-explosion",
        "08-technically-legal-completion"
    )]
    [string[]]$Creative = @("all"),

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpeg -or -not $ffprobe) {
    throw "ffmpeg and ffprobe must both be available on PATH."
}

$clipRoot = $PSScriptRoot
$previewRoot = [System.IO.Path]::GetFullPath((Join-Path $clipRoot "..\.."))
$screenshotRoot = Join-Path $previewRoot "screenshots"
$sourceStateRoot = Join-Path $clipRoot "source-states"
$fontPath = "C:\Windows\Fonts\arialbd.ttf"

if (-not (Test-Path -LiteralPath $fontPath)) {
    throw "Required operating-system font was not found at $fontPath."
}

New-Item -ItemType Directory -Force -Path $clipRoot, $sourceStateRoot | Out-Null

$creatives = @(
    [pscustomobject]@{
        Slug = "01-printer-leaves-one-tile"
        InputType = "still"
        Source = Join-Path $sourceStateRoot "01-printer-leaves-one-tile.png"
        HookLine1 = "THE PRINTER LEFT"
        HookLine2 = "ONE TILE"
        Support = "ONE GAP. THREE WORKPLACE HAZARDS."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "02-ceo-pinned-against-glass"
        InputType = "still"
        Source = Join-Path $screenshotRoot "squish.png"
        HookLine1 = "THE CEO WANTED"
        HookLine2 = "VISIBILITY"
        Support = "HR CALLED THIS EXECUTIVE CONTACT."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "03-intern-rotated-wrong"
        InputType = "still"
        Source = Join-Path $sourceStateRoot "03-intern-rotated-wrong.png"
        HookLine1 = "ORIENTATION WAS"
        HookLine2 = "NOT OPTIONAL"
        Support = "THE INTERN FOUND A NEW SLEEPING POSITION."
        Cta = "FIX THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "04-hr-99-to-lawsuit"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "04-hr-99-to-lawsuit.webm"
        HookLine1 = "HR WAS FINE AT"
        HookLine2 = "99 PERCENT"
        Support = "ONE MORE MOVE. LEGAL ENTERED THE ELEVATOR."
        Cta = "BEAT MY HR SCORE"
    },
    [pscustomobject]@{
        Slug = "05-perfect-last-second-fit"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "05-perfect-last-second-fit.webm"
        HookLine1 = "ONE PIECE"
        HookLine2 = "ONE LEGAL HOME"
        Support = "THE LAST DROP SAVED THE OFFICE."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "06-obvious-mistake-left-unfixed"
        InputType = "still"
        Source = Join-Path $screenshotRoot "invalid-placement.png"
        HookLine1 = "EVERYONE SAW"
        HookLine2 = "THE RED SQUARES"
        Support = "NOBODY MOVED THE PIECE. CLASSIC MANAGEMENT."
        Cta = "FIX THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "07-printer-paper-explosion"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "07-printer-paper-explosion.webm"
        HookLine1 = "THE PRINTER"
        HookLine2 = "CHOSE VIOLENCE"
        Support = "PAPER JAM BECAME PAPER WEATHER."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Slug = "08-technically-legal-completion"
        InputType = "still"
        Source = Join-Path $screenshotRoot "completion.png"
        HookLine1 = "TECHNICALLY LEGAL"
        HookLine2 = "IS STILL LEGAL"
        Support = "HR WILL FOLLOW UP AFTER THE DOORS CLOSE."
        Cta = "BEAT MY HR SCORE"
    }
)

if ($Creative -notcontains "all") {
    $requested = [System.Collections.Generic.HashSet[string]]::new([string[]]$Creative)
    $creatives = @($creatives | Where-Object { $requested.Contains($_.Slug) })
}

function ConvertTo-DrawTextValue {
    param([Parameter(Mandatory)][string]$Value)

    return $Value.Replace("\", "\\").Replace(":", "\:").Replace("'", "\'").Replace("%", "\%")
}

function Invoke-Ffmpeg {
    param([Parameter(Mandatory)][string[]]$Arguments)

    & $ffmpeg.Source @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg failed with exit code $LASTEXITCODE."
    }
}

$generated = [System.Collections.Generic.List[string]]::new()
$missing = [System.Collections.Generic.List[string]]::new()
$fontFilterPath = ConvertTo-DrawTextValue ($fontPath.Replace("\", "/"))

foreach ($item in $creatives) {
    if (-not (Test-Path -LiteralPath $item.Source)) {
        $missing.Add("$($item.Slug) -> $($item.Source)")
        Write-Warning "MISSING_SOURCE $($item.Slug): $($item.Source)"
        continue
    }

    $mp4Path = Join-Path $clipRoot "$($item.Slug).mp4"
    $webmPath = Join-Path $clipRoot "$($item.Slug).webm"

    if (-not $Force -and (Test-Path -LiteralPath $mp4Path) -and (Test-Path -LiteralPath $webmPath)) {
        Write-Host "SKIP_EXISTING $($item.Slug)"
        continue
    }

    $hookLine1 = ConvertTo-DrawTextValue $item.HookLine1
    $hookLine2 = ConvertTo-DrawTextValue $item.HookLine2
    $support = ConvertTo-DrawTextValue $item.Support
    $cta = ConvertTo-DrawTextValue $item.Cta

    if ($item.InputType -eq "still") {
        $inputArguments = @("-loop", "1", "-framerate", "30", "-i", $item.Source)
        $baseVideo = "scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560,zoompan=z='min(zoom+0.00035,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1080x1920:fps=30"
    }
    else {
        $inputArguments = @("-i", $item.Source)
        $baseVideo = "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,tpad=stop_mode=clone:stop_duration=6,trim=duration=6,setpts=PTS-STARTPTS"
    }

    $filter = @(
        $baseVideo,
        "setsar=1",
        "eq=contrast=1.04:saturation=1.08",
        "drawbox=x=0:y=0:w=iw:h=390:color=0x050B13@0.88:t=fill",
        "drawbox=x=0:y=1560:w=iw:h=360:color=0x050B13@0.9:t=fill",
        "drawbox=x=78:y=116:w=12:h=202:color=0xF04442@1:t=fill",
        "drawtext=fontfile='$fontFilterPath':text='FIRE YOUR COWORKERS':fontcolor=0xF04442:fontsize=36:x=108:y=74",
        "drawtext=fontfile='$fontFilterPath':text='$hookLine1':fontcolor=0xFFF0C4:fontsize=66:x=108:y=128:box=0",
        "drawtext=fontfile='$fontFilterPath':text='$hookLine2':fontcolor=0xFFF0C4:fontsize=66:x=108:y=207:box=0",
        "drawtext=fontfile='$fontFilterPath':text='$support':fontcolor=0xF8F5ED:fontsize=28:x=(w-text_w)/2:y=1632",
        "drawbox=x=180:y=1742:w=720:h=92:color=0xFFC928@1:t=fill",
        "drawtext=fontfile='$fontFilterPath':text='$cta':fontcolor=0x171109:fontsize=40:x=(w-text_w)/2:y=1767",
        "drawtext=fontfile='$fontFilterPath':text='PUBLIC PREVIEW':fontcolor=0xA7B6C3:fontsize=24:x=(w-text_w)/2:y=1866",
        "fade=t=in:st=0:d=0.25",
        "fade=t=out:st=5.7:d=0.3",
        "scale=iw:ih:out_range=tv",
        "format=yuv420p",
        "setparams=range=limited"
    ) -join ","

    Write-Host "GENERATING_MP4 $($item.Slug)"
    $mp4Arguments = @(
        "-hide_banner", "-loglevel", "error", "-y"
    ) + $inputArguments + @(
        "-vf", $filter,
        "-t", "6",
        "-an",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-map_metadata", "-1",
        $mp4Path
    )
    Invoke-Ffmpeg -Arguments $mp4Arguments

    Write-Host "GENERATING_WEBM $($item.Slug)"
    Invoke-Ffmpeg -Arguments @(
        "-hide_banner", "-loglevel", "error", "-y",
        "-i", $mp4Path,
        "-an",
        "-c:v", "libvpx-vp9",
        "-crf", "31",
        "-b:v", "0",
        "-deadline", "good",
        "-cpu-used", "3",
        "-row-mt", "1",
        "-pix_fmt", "yuv420p",
        "-map_metadata", "-1",
        $webmPath
    )

    foreach ($outputPath in @($mp4Path, $webmPath)) {
        $probe = & $ffprobe.Source -v error -select_streams v:0 -show_entries "stream=width,height,r_frame_rate,pix_fmt" -show_entries "format=duration" -of json $outputPath | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) {
            throw "ffprobe failed for $outputPath."
        }

        $stream = $probe.streams[0]
        $duration = [double]$probe.format.duration
        if ($stream.width -ne 1080 -or $stream.height -ne 1920 -or [math]::Abs($duration - 6.0) -gt 0.15) {
            throw "Output contract failed for $outputPath."
        }
    }

    $generated.Add($item.Slug)
}

Write-Host "GENERATED_COUNT=$($generated.Count)"
foreach ($slug in $generated) {
    Write-Host "GENERATED=$slug"
}
Write-Host "MISSING_COUNT=$($missing.Count)"
foreach ($entry in $missing) {
    Write-Host "MISSING=$entry"
}

if ($missing.Count -gt 0) {
    Write-Host "SOCIAL_CREATIVE_PACKAGE=PARTIAL"
}
else {
    Write-Host "SOCIAL_CREATIVE_PACKAGE=PASS"
}
