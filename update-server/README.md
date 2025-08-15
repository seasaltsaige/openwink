<div align="center">

# Open Wink Module Update Server

This directory contains the code base which serves as the update server for the Wink Module. This server holds the binary file which is sent over http requests to the app to stage for update of the module over a local AP that the module creates. The server is hosted on Netlify, using serverless functions.

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

Clone this repository and  ensure you are in the correct directory.
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
When updating the binary file in the update server, you must also update the description and version in the `./files/update.json` accordingly, so the app can compare current versions and potential update versions.

- Compile the new firmware into a `.bin` file. See [FLASHING.md](../docs/build/FLASHING.md) for more information.

- Update the versioning and provide a description in the `update.json` file 

- Rename the binary to `update.bin`, and replace the current binary file.

- Restart the server to serve the update binary.