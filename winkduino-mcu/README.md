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
- In the Board Manager, search for an install **esp32**@latest.
- Open the project in the IDE.
- Connect and Program the ESP Module.

## About the Code