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

    [string]$PublicBaseUrl = "{{PUBLIC_BASE_URL}}",

    [string]$Channel = "{{CHANNEL}}",

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpeg -or -not $ffprobe) {
    throw "ffmpeg and ffprobe must both be available on PATH."
}

if (-not $PublicBaseUrl.StartsWith("{{")) {
    $parsedPublicUrl = $null
    if (-not [Uri]::TryCreate($PublicBaseUrl, [UriKind]::Absolute, [ref]$parsedPublicUrl)) {
        throw "PublicBaseUrl must be an absolute URL or the default placeholder."
    }
    if ($parsedPublicUrl.Scheme -notin @("https", "http")) {
        throw "PublicBaseUrl must use HTTP or HTTPS."
    }
}

$clipRoot = $PSScriptRoot
$previewRoot = [System.IO.Path]::GetFullPath((Join-Path $clipRoot "..\.."))
$screenshotRoot = Join-Path $previewRoot "screenshots"
$sourceStateRoot = Join-Path $clipRoot "source-states"
$fontPath = "C:\Windows\Fonts\arialbd.ttf"
$generationReportPath = Join-Path $clipRoot "GENERATION-REPORT.md"
$publishCopyPath = Join-Path $clipRoot "PUBLISH-COPY.md"

if (-not (Test-Path -LiteralPath $fontPath)) {
    throw "Required operating-system font was not found at $fontPath."
}

New-Item -ItemType Directory -Force -Path $clipRoot, $sourceStateRoot | Out-Null

$allCreatives = @(
    [pscustomobject]@{
        Number = "01"
        Name = "Printer Leaves One Tile"
        Slug = "01-printer-leaves-one-tile"
        InputType = "still"
        FocusX = 0.50
        Source = Join-Path $sourceStateRoot "01-printer-leaves-one-tile.png"
        HookLine1 = "THE PRINTER LEFT"
        HookLine2 = "ONE TILE"
        Hook = "THE PRINTER LEFT ONE TILE."
        Support = "ONE GAP. THREE WORKPLACE HAZARDS."
        Caption = "One square. Three workplace hazards. The copier has already printed the incident report."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "02"
        Name = "CEO Pinned Against Glass"
        Slug = "02-ceo-pinned-against-glass"
        InputType = "still"
        FocusX = 0.50
        Source = Join-Path $screenshotRoot "squish.png"
        HookLine1 = "THE CEO WANTED"
        HookLine2 = "VISIBILITY"
        Hook = "THE CEO WANTED VISIBILITY."
        Support = "HR CALLED THIS EXECUTIVE CONTACT."
        Caption = "We gave him the entire glass wall. HR called it unscheduled executive contact."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "03"
        Name = "Intern Rotated Wrong"
        Slug = "03-intern-rotated-wrong"
        InputType = "still"
        FocusX = 0.72
        Source = Join-Path $sourceStateRoot "03-intern-rotated-wrong.png"
        HookLine1 = "ORIENTATION WAS"
        HookLine2 = "NOT OPTIONAL"
        Hook = "ORIENTATION WAS NOT OPTIONAL."
        Support = "THE INTERN FOUND A NEW SLEEPING POSITION."
        Caption = "The intern found a new sleeping position. HR found a new section of the handbook."
        Cta = "FIX THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "04"
        Name = "HR Goes From 99 to Lawsuit"
        Slug = "04-hr-99-to-lawsuit"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "04-hr-99-to-lawsuit.webm"
        HookLine1 = "HR WAS FINE AT"
        HookLine2 = "99 PERCENT"
        Hook = "HR WAS FINE AT 99 PERCENT."
        Support = "ONE MORE MOVE. LEGAL ENTERED THE ELEVATOR."
        Caption = "One more incident. Four violations. Legal has entered the elevator."
        Cta = "BEAT MY HR SCORE"
    },
    [pscustomobject]@{
        Number = "05"
        Name = "Perfect Last-Second Fit"
        Slug = "05-perfect-last-second-fit"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "05-perfect-last-second-fit.webm"
        HookLine1 = "ONE PIECE"
        HookLine2 = "ONE LEGAL HOME"
        Hook = "THE LAST PIECE HAD ONE LEGAL HOME."
        Support = "THE LAST DROP SAVED THE OFFICE."
        Caption = "One legal home. One final drop. The elevator called it Technically Legal."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "06"
        Name = "Obvious Mistake Left Unfixed"
        Slug = "06-obvious-mistake-left-unfixed"
        InputType = "still"
        FocusX = 0.50
        Source = Join-Path $screenshotRoot "invalid-placement.png"
        HookLine1 = "EVERYONE SAW"
        HookLine2 = "THE RED SQUARES"
        Hook = "EVERYONE SAW THE RED SQUARES."
        Support = "NOBODY MOVED THE PIECE. CLASSIC MANAGEMENT."
        Caption = "Nobody moved the piece. Classic management."
        Cta = "FIX THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "07"
        Name = "Printer Paper Explosion"
        Slug = "07-printer-paper-explosion"
        InputType = "recording"
        Source = Join-Path $sourceStateRoot "07-printer-paper-explosion.webm"
        HookLine1 = "THE PRINTER"
        HookLine2 = "CHOSE VIOLENCE"
        Hook = "THE PRINTER CHOSE VIOLENCE."
        Support = "PAPER JAM BECAME PAPER WEATHER."
        Caption = "Paper jam became paper weather. Facilities has left the group chat."
        Cta = "BEAT THIS OFFICE"
    },
    [pscustomobject]@{
        Number = "08"
        Name = "Technically Legal Completion"
        Slug = "08-technically-legal-completion"
        InputType = "still"
        FocusX = 0.50
        Source = Join-Path $screenshotRoot "completion.png"
        HookLine1 = "TECHNICALLY LEGAL"
        HookLine2 = "IS STILL LEGAL"
        Hook = "TECHNICALLY LEGAL IS STILL LEGAL."
        Support = "HR WILL FOLLOW UP AFTER THE DOORS CLOSE."
        Caption = "The elevator is full. HR will follow up after the doors close."
        Cta = "BEAT MY HR SCORE"
    }
)

if ($Creative -contains "all") {
    $selectedCreatives = $allCreatives
}
else {
    $requested = [System.Collections.Generic.HashSet[string]]::new([string[]]$Creative)
    $selectedCreatives = @($allCreatives | Where-Object { $requested.Contains($_.Slug) })
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

function Get-MediaProbe {
    param([Parameter(Mandatory)][string]$Path)

    $json = & $ffprobe.Source -v error -show_entries "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt" -show_entries "format=duration,size" -of json $Path
    if ($LASTEXITCODE -ne 0) {
        throw "ffprobe failed for $Path."
    }
    return $json | ConvertFrom-Json
}

function Get-VideoStream {
    param([Parameter(Mandatory)]$Probe)

    return @($Probe.streams | Where-Object { $_.codec_type -eq "video" })[0]
}

function Assert-SocialOutput {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][ValidateSet("h264", "vp9")][string]$ExpectedCodec
    )

    $probe = Get-MediaProbe -Path $Path
    $video = Get-VideoStream -Probe $probe
    $audioCount = @($probe.streams | Where-Object { $_.codec_type -eq "audio" }).Count
    $duration = [double]$probe.format.duration

    $failures = [System.Collections.Generic.List[string]]::new()
    if ($video.codec_name -ne $ExpectedCodec) { $failures.Add("codec=$($video.codec_name)") }
    if ($video.width -ne 1080 -or $video.height -ne 1920) { $failures.Add("size=$($video.width)x$($video.height)") }
    if ($video.r_frame_rate -ne "30/1") { $failures.Add("fps=$($video.r_frame_rate)") }
    if ($video.pix_fmt -ne "yuv420p") { $failures.Add("pixel_format=$($video.pix_fmt)") }
    if ([math]::Abs($duration - 6.0) -gt 0.15) { $failures.Add("duration=$duration") }
    if ($audioCount -ne 0) { $failures.Add("audio_streams=$audioCount") }

    if ($failures.Count -gt 0) {
        throw "Output contract failed for ${Path}: $($failures -join ', ')."
    }

    return [pscustomobject]@{
        Codec = $video.codec_name
        Dimensions = "$($video.width)x$($video.height)"
        Fps = $video.r_frame_rate
        PixelFormat = $video.pix_fmt
        Duration = [math]::Round($duration, 3)
        Bytes = [int64]$probe.format.size
        Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
    }
}

function Get-DestinationUrl {
    param([Parameter(Mandatory)][string]$Slug)

    $base = $PublicBaseUrl.TrimEnd("/")
    return "$base/?utm_source=$Channel&utm_medium=organic_social&utm_campaign=public_preview&utm_content=$Slug#play"
}

$fontFilterPath = ConvertTo-DrawTextValue ($fontPath.Replace("\", "/"))

foreach ($item in $selectedCreatives) {
    if (-not (Test-Path -LiteralPath $item.Source)) {
        Write-Warning "MISSING_SOURCE $($item.Slug): $($item.Source)"
        continue
    }

    $sourceProbe = Get-MediaProbe -Path $item.Source
    $sourceVideo = Get-VideoStream -Probe $sourceProbe
    if (-not $sourceVideo) {
        throw "No visual stream was found in $($item.Source)."
    }

    $mp4Path = Join-Path $clipRoot "$($item.Slug).mp4"
    $webmPath = Join-Path $clipRoot "$($item.Slug).webm"
    $outputsExist = (Test-Path -LiteralPath $mp4Path) -and (Test-Path -LiteralPath $webmPath)

    if (-not $Force -and $outputsExist) {
        Write-Host "VERIFY_EXISTING $($item.Slug)"
        Assert-SocialOutput -Path $mp4Path -ExpectedCodec "h264" | Out-Null
        Assert-SocialOutput -Path $webmPath -ExpectedCodec "vp9" | Out-Null
        continue
    }

    $hookLine1 = ConvertTo-DrawTextValue $item.HookLine1
    $hookLine2 = ConvertTo-DrawTextValue $item.HookLine2
    $support = ConvertTo-DrawTextValue $item.Support
    $cta = ConvertTo-DrawTextValue $item.Cta

    if ($item.InputType -eq "still") {
        $inputArguments = @("-loop", "1", "-framerate", "30", "-i", $item.Source)
        $focusX = [double]$item.FocusX
        $baseVideo = "scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560:x='max(0,min(iw-1440,iw*$focusX-720))':y='(ih-2560)/2',zoompan=z='min(zoom+0.00035,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1080x1920:fps=30"
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
    $mp4Arguments = @("-hide_banner", "-loglevel", "error", "-y") + $inputArguments + @(
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

    Assert-SocialOutput -Path $mp4Path -ExpectedCodec "h264" | Out-Null
    Assert-SocialOutput -Path $webmPath -ExpectedCodec "vp9" | Out-Null
}

$inventoryRows = [System.Collections.Generic.List[object]]::new()
$publishSections = [System.Collections.Generic.List[string]]::new()
$missingEntries = [System.Collections.Generic.List[string]]::new()

foreach ($item in $allCreatives) {
    $mp4Path = Join-Path $clipRoot "$($item.Slug).mp4"
    $webmPath = Join-Path $clipRoot "$($item.Slug).webm"
    $sourceExists = Test-Path -LiteralPath $item.Source
    $outputsExist = (Test-Path -LiteralPath $mp4Path) -and (Test-Path -LiteralPath $webmPath)

    if ($sourceExists -and $outputsExist) {
        $mp4Info = Assert-SocialOutput -Path $mp4Path -ExpectedCodec "h264"
        $webmInfo = Assert-SocialOutput -Path $webmPath -ExpectedCodec "vp9"
        $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $item.Source).Hash
        $inventoryRows.Add([pscustomobject]@{
            Number = $item.Number
            Name = $item.Name
            Status = "PASS"
            Source = [System.IO.Path]::GetRelativePath($previewRoot, $item.Source).Replace("\", "/")
            SourceSha256 = $sourceHash
            Mp4Bytes = $mp4Info.Bytes
            Mp4Sha256 = $mp4Info.Sha256
            WebmBytes = $webmInfo.Bytes
            WebmSha256 = $webmInfo.Sha256
        })
    }
    else {
        $status = if (-not $sourceExists) { "BLOCKED: source missing" } else { "BLOCKED: outputs missing" }
        $inventoryRows.Add([pscustomobject]@{
            Number = $item.Number
            Name = $item.Name
            Status = $status
            Source = [System.IO.Path]::GetRelativePath($previewRoot, $item.Source).Replace("\", "/")
            SourceSha256 = "—"
            Mp4Bytes = "—"
            Mp4Sha256 = "—"
            WebmBytes = "—"
            WebmSha256 = "—"
        })
        $missingEntries.Add("$($item.Slug) -> $($item.Source)")
    }

    $destination = Get-DestinationUrl -Slug $item.Slug
    $publishSections.Add(@"
## $($item.Number) — $($item.Name)

- Hook: $($item.Hook)
- Caption: $($item.Caption)
- CTA: $($item.Cta)
- Destination: $destination
- Export status: $($inventoryRows[$inventoryRows.Count - 1].Status)
"@)
}

$recordingChecks = [System.Collections.Generic.List[string]]::new()
$proofRecordings = @(
    [pscustomobject]@{ Name = "Desktop gameplay"; Path = Join-Path $previewRoot "videos\desktop-gameplay.webm" },
    [pscustomobject]@{ Name = "Mobile gameplay"; Path = Join-Path $previewRoot "videos\mobile-gameplay.webm" }
)

foreach ($recording in $proofRecordings) {
    if (-not (Test-Path -LiteralPath $recording.Path)) {
        $recordingChecks.Add("| $($recording.Name) | MISSING | — | — | — |")
        continue
    }

    $probe = Get-MediaProbe -Path $recording.Path
    $video = Get-VideoStream -Probe $probe
    $duration = [math]::Round([double]$probe.format.duration, 3)
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $recording.Path).Hash
    $recordingChecks.Add("| $($recording.Name) | PRESENT | $($video.width)x$($video.height) | $duration s | ``$hash`` |")
}

$passCount = @($inventoryRows | Where-Object { $_.Status -eq "PASS" }).Count
$packageStatus = if ($passCount -eq 8) { "PASS" } else { "PARTIAL" }
$reportLines = [System.Collections.Generic.List[string]]::new()
$reportLines.Add("# Social Creative Generation Report")
$reportLines.Add("")
$reportLines.Add("Generated: $([DateTimeOffset]::UtcNow.ToString('u'))")
$reportLines.Add("Public base: ``$PublicBaseUrl``")
$reportLines.Add("Channel: ``$Channel``")
$reportLines.Add("")
$reportLines.Add("Every PASS output was verified as 1080×1920, 30 fps, six seconds, yuv420p, expected codec, and zero audio streams.")
$reportLines.Add("")
$reportLines.Add("| # | Concept | Status | Truth source | MP4 bytes | WebM bytes |")
$reportLines.Add("| --- | --- | --- | --- | ---: | ---: |")
foreach ($row in $inventoryRows) {
    $reportLines.Add("| $($row.Number) | $($row.Name) | $($row.Status) | ``$($row.Source)`` | $($row.Mp4Bytes) | $($row.WebmBytes) |")
}
$reportLines.Add("")
$reportLines.Add("## Hash inventory")
$reportLines.Add("")
foreach ($row in $inventoryRows | Where-Object { $_.Status -eq "PASS" }) {
    $reportLines.Add("### $($row.Number) — $($row.Name)")
    $reportLines.Add("")
    $reportLines.Add("- Source SHA-256: ``$($row.SourceSha256)``")
    $reportLines.Add("- MP4 SHA-256: ``$($row.Mp4Sha256)``")
    $reportLines.Add("- WebM SHA-256: ``$($row.WebmSha256)``")
    $reportLines.Add("")
}
$reportLines.Add("## Gameplay recordings")
$reportLines.Add("")
$reportLines.Add("| Recording | Status | Dimensions | Duration | SHA-256 |")
$reportLines.Add("| --- | --- | --- | ---: | --- |")
foreach ($line in $recordingChecks) { $reportLines.Add($line) }
$reportLines.Add("")
$reportLines.Add("SOCIAL_CREATIVE_PACKAGE=$packageStatus")
$reportLines.Add("SOCIAL_CREATIVE_PASS_COUNT=$passCount")

[System.IO.File]::WriteAllLines($generationReportPath, $reportLines, [System.Text.UTF8Encoding]::new($false))

$publishLines = @(
    "# Fire Your Coworkers — Publish Copy",
    "",
    "Generated with public base ``$PublicBaseUrl`` and channel ``$Channel``.",
    "",
    "Destination placeholders are preserved unless explicit values were supplied to the generator.",
    ""
) + $publishSections
[System.IO.File]::WriteAllLines($publishCopyPath, $publishLines, [System.Text.UTF8Encoding]::new($false))

Write-Host "SOCIAL_CREATIVE_PACKAGE=$packageStatus"
Write-Host "SOCIAL_CREATIVE_PASS_COUNT=$passCount"
foreach ($entry in $missingEntries) {
    Write-Host "MISSING=$entry"
}
Write-Host "REPORT=$generationReportPath"
Write-Host "PUBLISH_COPY=$publishCopyPath"
