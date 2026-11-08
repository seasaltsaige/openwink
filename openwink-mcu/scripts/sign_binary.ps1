param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

bin_signing `
    --bin ./build/esp32.esp32.esp32s3/openwink-mcu.ino.bin `
    --key private_key.pem `
    --out "../update-server/files/firmware/update-$Version.bin" `
    --hash sha256