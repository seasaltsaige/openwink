<div align="center">

# Open Wink Module

This directory contains the firmware for the OpenWink receiver module. The module installs between the NA Miata/MX-5 headlight connectors and provides BLE control, headlight command execution, OEM retractor button actions, auxiliary button inputs, persistent settings, movement timing, and module status reporting.

Please keep in mind, this directory is highly volatile. See [issue #14](https://github.com/seasaltsaige/openwink/issues/14) for more information.

[![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white)](https://cplusplus.com/)
[![Espressif](https://img.shields.io/badge/espressif-E7352C.svg?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)
[![BLE](https://img.shields.io/badge/Bluetooth_Low_Energy-0082FC.svg?style=for-the-badge&logo=Bluetooth&logoColor=white)](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/)
</div>

## Getting Started
### Arduino IDE
Download and install the latest version of the [Arduino IDE](https://www.arduino.cc/en/software/).

- In the Library Manager, search for and install **NimBLE-Arduino**@latest.
  - Search for the corresponding installation location, and find your *nimconfig.h* header file. Then locate the following line, and uncomment the definition.
    ```h
    /** @brief Un-comment to enable extended advertising */
    // #define CONFIG_BT_NIMBLE_EXT_ADV 1
    ```
    The module utilizes the Coded PHY advertising protocol to try for a long and stable connection range. Though this can be hard to guarantee due to interference caused by the hood of the car.
- In the Board Manager, search for and install **esp32**@latest.
- Open the project in the IDE.
- Connect and program the ESP module.

## About the Code

This firmware is responsible for the low-level behavior of the OpenWink module. It receives commands from the controller app over Bluetooth Low Energy, controls the headlight outputs, monitors button inputs, stores module settings, and reports module/headlight state back to the app.

Current module capabilities include:

- **BLE Communication**: Advertises and communicates with the OpenWink controller app using Bluetooth Low Energy.
- **Pairing Security**: Generates and uses a pairing key so only the paired app/device can reconnect to the module.
- **Default Headlight Actions**: Supports left/right/both up, down, wink, blink, wave, and sleepy-eye behavior.
- **Command Execution**: Runs commands received from the app, OEM retractor button, or auxiliary button inputs.
- **Custom Command Support**: Executes app-defined command sequences and supports looping behavior where configured.
- **OEM Retractor Button Handling**: Supports custom multi-press actions from the factory retractor button.
- **Auxiliary Button Inputs**: Supports additional physical button inputs with configurable actions, button type behavior, and macro looping.
- **Headlight Bypass Behavior**: Supports configurable bypass behavior for allowing custom button actions while headlights are on.
- **Headlight Perspective**: Supports swapped left/right behavior for driver-side or outside-car perspective.
- **Wave Delay Timing**: Stores and applies configurable timing between left and right headlight actuation.
- **Press Interval Timing**: Stores and applies configurable timing for detecting sequential button presses.
- **Sleepy Eye Positioning**: Stores and applies sleepy-eye configuration for each headlight.
- **Headlight Position Reporting**: Reports current left and right headlight position state to the controller app.
- **Movement Timing**: Tracks left and right headlight movement times, which can be used to monitor motor behavior and spot potential mechanical or electrical issues over time.
- **Persistent Storage**: Saves module settings so configuration survives power loss.
- **OTA Update Support**: Supports firmware update behavior used by the controller app and update server.
- **Module Sleep/Recovery Behavior**: Provides module-level behavior for app-driven sleep, reset, and recovery workflows where supported.

This code base is split up into multiple files to separate functionality and allow reuse throughout the project.

`openwink-mcu.ino` is the main entry point of the program, initializing and starting the firmware components that work together.

`constants.cpp/h` contains constants and definitions that get used throughout the project files.

`BLE.cpp/h` contains code which initializes and starts corresponding BLE services and characteristics.

`BLECallbacks.cpp/h` contains callback functions which are called when BLE characteristics are written to by the controller app.

`ButtonHandler.cpp/h` contains code which handles interactions with the OEM retractor button, including default behavior, custom actions, press timing, and looping behavior.

`AuxHandler.cpp/h` contains code which handles additional auxiliary button inputs, including configured actions, momentary/latching behavior, and macro looping.

`CommandHandler.cpp/h` contains command parsing and command dispatch behavior for actions received from the app, OEM retractor button, or auxiliary button inputs.

`MainFunctions.cpp/h` contains main headlight action functions which get reused throughout the code base. These are functions which define specific headlight movement actions.

`Storage.cpp/h` contains code which initiates and provides storage options to save settings in the case the module loses power completely.

## Acknowledgements

- Project originally inspired by [MX-5 Tech Wink Mod](https://mx5tech.co.uk/wink-sleepy-eye-mod) and [instructables tutorial](https://www.instructables.com/Popup-headlight-wink-with-arduino-and-relay-board-/).
- Special thanks to [pyroxenes](https://github.com/pyroxenes/) for creating and assembling the custom circuit board this project utilizes.
