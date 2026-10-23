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

bin_signing `
    --bin ./.pio/build/esp32-s3-devkitc-1-n4/firmware.bin `
    --key private_key.pem `
    --out "../update-server/files/firmware/update-$Version.bin" `
    --hash sha256
