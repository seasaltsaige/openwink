param(
    [Parameter(Mandatory = $false)]
    [string]$Version = ""
)

if ([string]::IsNullOrWhiteSpace($Version)) {
    if (Test-Path "./version.txt") {
        $Version = (Get-Content "./version.txt" -Raw).Trim()
    } else {
        Write-Error "version.txt not found and no -Version parameter provided."
        exit 1
    }
}

$BinPath = "./.pio/build/esp32-s3-devkitc-1-n4/firmware.bin"
if (-not (Test-Path $BinPath)) {
    Write-Error "Firmware binary not found at $BinPath. Run 'pio run -e esp32-s3-devkitc-1-n4' first."
    exit 1
}

$Bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $BinPath))
$EmbeddedVersion = [System.Text.Encoding]::ASCII.GetString($Bytes, 0x30, 32).TrimEnd([char]0)
if ($EmbeddedVersion -ne $Version) {
    Write-Error "Embedded firmware version '$EmbeddedVersion' in $BinPath does not match target version '$Version'. Rebuild the firmware first."
    exit 1
}

bin_signing `
    --bin $BinPath `
    --key private_key.pem `
    --out "../update-server/files/firmware/update-$Version.bin" `
    --hash sha256
