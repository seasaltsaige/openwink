<div align="center">

# Open Wink Update Server

This directory contains the update server for OpenWink. It serves module firmware, signed app update manifests, and the app bundles and assets used for OTA updates.

The update server is hosted on Netlify using serverless functions. The app checks the hosted update metadata, compares the available firmware version against the connected module's current version, and downloads the update binary when an update is available.

[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)](https://expressjs.com/)
[![Netlify](https://img.shields.io/badge/netlify-%23000000.svg?style=for-the-badge&logo=netlify&logoColor=#00C7B7)](https://www.netlify.com/)

</div>

## Libraries Used
```bash
> @netlify/functions
> express
> netlify-cli
> netlify-lambda
> serverless-http
```

## Getting Started

Clone this repository and ensure you are in the correct directory.

```bash
> git clone https://github.com/seasaltsaige/openwink.git
> cd ./openwink/update-server
```

Install required dependencies.

```bash
> npm install
```

Build Netlify functions.

```bash
> npm run build
```

Start the local server.

```bash
> npm run start
```

### New Version
When updating the firmware binary served by the update server, you must also update the description and version in `./files/update.json`. The controller app uses this metadata to compare the connected module's current firmware version against the available update version.

- Build the [ESP-IDF firmware](../openwink-mcu-platformio/README.md) for the production N4 board.

- Add an entry to `./files/update.json` with the version, description, `required_firmware_version`, and `required_app_version`. Keep older entries needed by the update chain. The server treats the last entry as the latest release.

- The OTA binary must be signed. The firmware project's [signing script](../openwink-mcu-platformio/scripts/sign_binary.ps1) writes it to `files/firmware/update-<version>.bin`. Do not substitute the combined initial flashing image.

- Deploy the updated metadata and binaries together. For local testing, restart the local server after changing the files.
