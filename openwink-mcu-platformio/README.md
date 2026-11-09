# OpenWink Module Firmware

The OpenWink module firmware uses ESP-IDF through PlatformIO. It handles Bluetooth commands, headlight movement, button inputs, and saved settings.

The old Arduino implementation is kept in [openwink-mcu](../openwink-mcu/README.md) for reference.

## Boards

The build environments are defined in [platformio.ini](./platformio.ini):

- **ESP32-S3 N4:** Production board, `esp32-s3-devkitc-1-n4`.
- **ESP32-S3 N32/R16:** Development only, `esp32-s3-devkitc-1-n32-r16`.

## Building

With [PlatformIO](https://docs.platformio.org/en/latest/core/installation/index.html) installed, run this from the `openwink-mcu-platformio` directory to build for the production board:

```bash
pio run -e esp32-s3-devkitc-1-n4
```

Set the firmware version in [version.txt](./version.txt). Initial flashing and recovery instructions are still being added to the [flashing guide](../docs/FLASHING.md).

For an installed module, [update the firmware through the app](../docs/GETTING_STARTED.md#check-for-updates).
