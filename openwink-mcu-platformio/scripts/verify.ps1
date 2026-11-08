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
    --verify "../update-server/files/firmware/update-$Version.bin" `
    --pubkey ./public_key.pem `
    --hash sha256
