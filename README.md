<div align="center">

# Winkduino Headlight Wink Mod
An open sourced alternative to the popular Mazda Miata MX-5 [Wink/Sleepy Eye Mod](https://mx5tech.co.uk/wink-sleepy-eye-mod). Upgrade your Miata's style with a community driven open-source kit.

[![Miatas Winking](https://img.shields.io/badge/Miatas-Winking-darkred?style=for-the-badge)](https://tenor.com/view/miata-wink-miata-wink-i-stole-this-gif-pop-up-headlights-gif-25076583)
### Technologies
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) 
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Netlify](https://img.shields.io/badge/netlify-%23000000.svg?style=for-the-badge&logo=netlify&logoColor=#00C7B7)

![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white) 
![Espressif](https://img.shields.io/badge/espressif-E7352C.svg?style=for-the-badge&logo=espressif&logoColor=white)
![BLE](https://img.shields.io/badge/Bluetooth_Low_Energy-0082FC.svg?style=for-the-badge&logo=Bluetooth&logoColor=white)
</div>

# Table of Contents
- [About the Project](#about-the-project)
- [Project Features](#project-features)
  - [Update Server](#update-server)
  - [Controller Application](#controller-application)
  - [Wink Module](#wink-module)
- [Purchasing](#purchasing)
  - [Support the Project](#support-the-project-)
- [Contributing](#contributing-)
- [Development Roadmap](#development-roadmap)
- [License](#license-)
- [Credits](#credits)
- [Contact](#contact-me)


## About the Project
This project [started](https://github.com/seasaltsaige/popup-wink-mod) as a basic and rudimentary project using off the shelf components, and closely following the guides of online resources. After finding a [project partner](https://github.com/pyroxenes), who designed our custom PCB, the project has been able to evolve into a fully featured project.

This project serves as an open source (though purchasable) alternative to the popular [MX-5 Tech Wink Mod](https://mx5tech.co.uk/wink-sleepy-eye-mod). This repository contains the code base for several components of the project. 
- The Update Server, used to push OTA updates to the Module, allowing for quick bug fixes if issues arise.
- The App, a React Native application that can be built to both Android and iOS. 
  - For more information on pre-built application installation, visit [here](./docs/build/BUILD.md#pre-built-application).
  - For more information on building your own app, visit [here](./docs/build/BUILD.md#custom-build)
- The Module, code which compiles and gets flashed to the module board itself, allowing interaction with the cars' headlights.
  - See [Issue #14](https://github.com/seasaltsaige/winkduino-long-range/issues/14) for ESP-IDF refactor
  - For more information on module flashing, visit [here](./docs/build/FLASHING.md).
  - For more information on the module board design, visit [here](todo:link_to_board_design)

## Project Features
### Update Server
- Manages over the air (OTA) firmware updates for the Wink Module.
- Allows for quick bug fixes and feature pushes without removal from your Miata.
- Lightweight and built with Express, ensuring reliable delivery of software.
- Versioning in updates, preventing accidental downgrades of firmware version.
### Controller Application 
- Mobile application built with React Native and Expo, allowing for cross platform build for both Android and iOS. (Pre-built app currently available only for Android. See [Custom Build Guide](./docs/build/BUILD.md#custom-build) for more information)
- Controller based on Bluetooth Low Energy (BLE), allowing for long range communication and control.
- **Default Commands**: Left/Right/Both Up, Down, Blink/Wink and Wave
- Sleepy Eye: Allows for precise, per-headlight setup for a custom look.
- **Wave Delay**: Customization of delay between headlight actuation, for precise, desired wave style.
- **Custom Commands**: Create, save, and run a collection of commands,allowing for unique, custom headlight animations.
- **App Theme**: Minimal UI with additional theme customization to match NA Miata color themes.
- **Transparent Storage**: All data and settings stored on the app can be easily accessed and deleted in the App Settings.
- **OEM Button**: Assign custom actions for the OEM Retractor Button (from 2-10 sequential presses), executing pre-defined actions with configurable timing between presses, allowing for app-like actions without relying on the app. 
- Built in firmware updates for Wink Module, utilizing the Update Server and a local WiFi AP.

### Wink Module
- Custom PCB designed by [pyroxenes](https://github.com/pyroxenes) allowing for clean integration into the Miatas headlight circuitry.
- Powered by an ESP32-S3 MCU allowing for Coded Phy BLE communications.
- Plug and Play installation with no wire splicing required.
- Open source firmware developed in C++, allowing for custom modification and community contributions.

## Purchasing
For more information about purchasing a pre-made module, please visit [miatawink.tech](https://miatawink.tech/).


### Support the Project [![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/seasaltsaige)
If you would rather support the open source initiative for the project, feel free to [donate](https://buymeacoffee.com/seasaltsaige) to keep the project alive.

## Contributing [![contributions welcome](https://img.shields.io/badge/contributions-welcome-darkred.svg?style=for-the-badge)](./docs/CONTRIBUTING.md)
Contributions are always welcome! Whether you found a bug or have a feature that you would like to see added, head over to the [Contribution Guide](./docs/CONTRIBUTING.md), and open a bug report/feature request. Ensure you follow the Code of Conduct, and scan through the open [issues](https://github.com/seasaltsaige/winkduino-long-range/issues) to ensure you don't create a duplicate request.

## Development Roadmap
For a detailed overview of the planned and in progress features for the project, see the open [issues](https://github.com/seasaltsaige/winkduino-long-range/issues) and [project board](https://github.com/users/seasaltsaige/projects/1).
Contributions are always welcome!

## License [![License](https://img.shields.io/github/license/seasaltsaige/winkduino-long-range?style=for-the-badge)](./LICENSE)
The [Winkduino Wink Mod](https://github.com/seasaltsaige/winkduino-long-range) is free and open-source collection of software and hardware licensed under the [GPL v3 License](./LICENSE). 

## Credits
The Winkduino project codebase was created and is maintained by [seasaltsaige](https://github.com/seasaltsaige).

- Special thanks to [pyroxenes](https://github.com/pyroxenes) for creating and iterating on the PCB design and assembly. 
  - See related - [Board Design](todo:pyroxenes_github_link)


## Contact Me
You can reach me through my website at [miatawink.tech/contact](https://miatawink.tech/contact)