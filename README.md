<div align="center">

# Open Wink Headlight Mod
An open-source, programmable pop-up headlight controller for 1989-1997 NA Mazda Miatas/MX-5s. OpenWink supports wink, wave, blink, sleepy-eye, custom animations, configurable button actions, OTA firmware updates, and built-in module diagnostics.

[![Miatas Winking](https://img.shields.io/badge/Miatas-Winking-darkred?style=for-the-badge)](https://tenor.com/view/miata-wink-miata-wink-i-stole-this-gif-pop-up-headlights-gif-25076583)
### Technologies

[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)](https://expressjs.com/)
[![Netlify](https://img.shields.io/badge/netlify-%23000000.svg?style=for-the-badge&logo=netlify&logoColor=#00C7B7)](https://www.netlify.com/)

[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)](https://docs.expo.dev/)


[![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white)](https://cplusplus.com/)
[![Espressif](https://img.shields.io/badge/espressif-E7352C.svg?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)
[![BLE](https://img.shields.io/badge/Bluetooth_Low_Energy-0082FC.svg?style=for-the-badge&logo=Bluetooth&logoColor=white)](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/)
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
- [Credits](#acknowledgements)
- [Contact](#contact-me)


## About the Project
This project [started](https://github.com/seasaltsaige/popup-wink-mod) as a basic and rudimentary project using off the shelf components, and closely following the guides of online resources. After finding a [project partner](https://github.com/pyroxenes), who designed the custom PCB, the project has been able to evolve into a fully featured, custom project.

OpenWink serves as an open source, community driven, and purchasable alternative to closed Mazda Miata/MX-5 wink and sleepy-eye modules, including the popular [MX-5 Tech Wink Mod](https://mx5tech.co.uk/wink-sleepy-eye-mod). Rather than acting only as a simple remote, OpenWink is designed to be a programmable headlight control system with app control, physical button customization, OTA updates, transparent configuration, and built-in diagnostics.

This repository contains the code base for several components of the project. 
- The Update Server, used to push OTA updates to the Module, allowing for quick bug fixes and feature releases without removing the module from the car.
- The App, a React Native application that can be built to both Android and iOS. 
  - For more information on pre-built application installation, visit [here](./docs/build/BUILD.md#pre-built-application).
  - For more information on building your own app, visit [here](./docs/build/BUILD.md#custom-build-artifact)
- The Module, code which compiles and gets flashed to the module board itself, allowing interaction with the cars' headlights.
  - See [Issue #14](https://github.com/seasaltsaige/openwink/issues/14) for ESP-IDF refactor
  - For more information on module flashing, visit [here](./docs/build/FLASHING.md).
  - For more information on the module board design, visit [here](https://github.com/pyroxenes/openwink-hardware-module)

## Project Features
### Update Server
- Manages over the air (OTA) firmware updates for the Wink Module.
- Allows for quick bug fixes and feature pushes without removal from your Miata.
- Lightweight and built with Express, ensuring reliable delivery of software.
- Versioning in updates, preventing accidental downgrades of firmware version.
- Provides the update metadata and firmware binary used by the controller application when updating a connected module.

### Controller Application 
- Mobile application built with React Native and Expo, allowing for cross platform build for both Android and iOS. (Pre-built app currently available only for Android. See [Custom Build Guide](./docs/build/BUILD.md#custom-build-artifact) for more information)
- Controller based on Bluetooth Low Energy (BLE), allowing for long range communication and control.
- **Default Commands**: Left/Right/Both Up, Down, Blink/Wink and Wave.
- **Manual Control**: Independently raise or lower the left headlight, right headlight, or both headlights directly from the app.
- **Live Headlight Status**: The app mirrors the current headlight state in near real time, animating commands as they happen on the car.
- **Sleepy Eye**: Allows for precise, per-headlight setup for a custom look.
- **Wave Delay**: Customization of delay between headlight actuation, for precise, desired wave style.
- **Custom Commands**: Create, save, and run collections of commands, allowing for unique, custom headlight animations.
- **Macro Looping**: Custom commands can be assigned as looping actions where supported, allowing repeated animations until cancelled.
- **Quick Links**: Customize which frequently used pages appear on the home screen for faster access to the settings and actions you use most.
- **App Theme**: Minimal UI with additional theme customization to match NA Miata color themes.
- **System Profiles**: Save and manage app/module configuration profiles for different use cases.
- **System Information and Diagnostics**: View application version, firmware version, module ID, connection state, current headlight positions, saved settings, button mappings, custom command presets, and movement timing.
- **Headlight Movement Timing**: Monitor left and right headlight movement times, which can help identify changes in motor behavior, linkage friction, wiring issues, or other mechanical/electrical problems over time.
- **Transparent Storage**: All data and settings stored on the app can be easily accessed and deleted in the App Settings.
- **Pairing Security**: The module generates a pairing key that is stored by the app for reconnecting, allowing only the paired device to connect to the module.
- **Auto Connect**: Optionally reconnect to the saved module automatically when opening the app.
- **OEM Button**: Assign custom actions for the OEM Retractor Button (from 2-9 sequential presses), executing pre-defined actions or aforementioned custom commands with configurable timing between presses, allowing for app-like actions without being reliant on the app. 
  - Ability to bypass MX-5 Tech Wink restriction which disallows button presses while your headlight lights are turned on. *(Only tested on '93) (Don't be stupid with this)*
- **Auxiliary Buttons**: Configure additional physical button inputs with custom actions, momentary/latching behavior, and macro looping where supported.
- **Headlight Perspective**: Swap left and right behavior/display perspective to match driver-side or outside-car orientation.
- **Module Sleep and Recovery Tools**: Put the module to sleep, forget a paired module from the app, or delete saved module settings when needed.
- Built in firmware updates for Wink Module, utilizing the Update Server and BLE.

### Wink Module
- Custom PCB designed by [pyroxenes](https://github.com/pyroxenes) allowing for clean integration into the Miata's headlight circuitry.
- Powered by an ESP32-S3 MCU allowing for Coded PHY BLE communications.
- Plug and Play installation with no wire splicing required.
- Open source firmware developed in C++, allowing for custom modification and community contributions.
- Supports app-based control, OEM retractor button actions, and auxiliary button inputs.
- Stores module configuration and exposes status information to the controller application.
- Tracks headlight movement timing for left and right motor actuation.
- Supports OTA firmware updates through the OpenWink controller app.

## Purchasing
Coming Soon...


### Support the Project [![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/seasaltsaige)
If you would rather support the open source initiative for the project, feel free to [donate](https://buymeacoffee.com/seasaltsaige) to keep the project alive.

## Contributing [![contributions welcome](https://img.shields.io/badge/contributions-welcome-darkred.svg?style=for-the-badge)](./docs/CONTRIBUTING.md)
Contributions are always welcome! Whether you found a bug or have a feature that you would like to see added, head over to the [Contribution Guide](./docs/CONTRIBUTING.md), and open a bug report/feature request. Ensure you follow the Code of Conduct, and scan through the open [issues](https://github.com/seasaltsaige/openwink/issues) to ensure you don't create a duplicate request.

## Development Roadmap
For a detailed overview of the planned and in progress features for the project, see the open [issues](https://github.com/seasaltsaige/openwink/issues) and [project board](https://github.com/users/seasaltsaige/projects/1).
Contributions are always welcome!

## License [![License](https://img.shields.io/github/license/seasaltsaige/openwink?style=for-the-badge)](./LICENSE)
The [Open Wink - Wink Mod](https://github.com/seasaltsaige/openwink) is free and open-source collection of software and hardware licensed under the [GPL v3 License](./LICENSE). 

## Acknowledgements
The Open Wink project codebase was created and is maintained by [seasaltsaige](https://github.com/seasaltsaige).

- Special thanks to [pyroxenes](https://github.com/pyroxenes) for creating and iterating on the PCB design and assembly. 
  - See related - [Board Design](https://github.com/pyroxenes/openwink-hardware-module)


## Contact Me
You can reach me through my website at [miatawink.tech/contact](https://miatawink.tech/contact)

Join the discord server here [https://discord.gg/jaP67bgZBM](https://discord.gg/jaP67bgZBM)
