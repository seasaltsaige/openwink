<div align="center">

# Open Wink Module Update Server

This directory contains the update server for the OpenWink Module. The server provides firmware update metadata and hosts the firmware binary used by the controller app when staging OTA updates for the module.

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

- Compile the new firmware into a `.bin` file. See [FLASHING.md](../docs/build/FLASHING.md) for more information.

- Update the version and description in `./files/update.json`.

- Rename the compiled binary to `update.bin`, and replace the current binary file.

- Restart the server to serve the updated firmware binary.
