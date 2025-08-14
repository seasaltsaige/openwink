<div align="center">

# Wink Module

This directory contains the code base for the receiver module, which wires in between the headlight connectors. Please keep in mind, this directory is highly volatile. See [issue #14](https://github.com/seasaltsaige/winkduino-long-range/issues/14) for more information.

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
    The module utilizes the Coded Phy advertising protocol to try for a long and stable connection range. Though this can be hard to guarantee due to interference caused by the hood of the car.
- In the Board Manager, search for and install **esp32**@latest.
- Open the project in the IDE.
- Connect and Program the ESP Module.

## About the Code

This code base is split up into multiple files to split functionality up to be reused through the project as needed.

`winkduino-mcu.ino` is the main entry point of the program, initializing and starting components of program that work together.

`constants.cpp/h` contains constants and definitions that get used throughout the project files.

`BLE.cpp/h` contains code which initializes and starts corresponding BLE services and characteristics. 

`BLECallbacks.cpp/h` contains callback functions which are called when Characteristics are written to.

`ButtonHandler.cpp/h` contains code which handles interactions with the OEM retractor button, whether or not the customization functionality is enabled or not.

`MainFunctions.cpp/h` contains main headlight action functions which get reused throughout the code base. These are functions which define specific headlight movement actions.

`Storage.cpp/h` contains code which initiates and provides storage options to save settings in the case the module loses power completely.

## Acknowledgements

- Project originally inspired by [MX-5 Tech Wink Mod](https://mx5tech.co.uk/wink-sleepy-eye-mod) and [instructables tutorial](https://www.instructables.com/Popup-headlight-wink-with-arduino-and-relay-board-/).
- Special thanks to [pyroxenes](https://github.com/pyroxenes/) for creating and assembling the custom circuit board this project utilizes.