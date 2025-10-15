cmake_minimum_required(VERSION 3.16.0)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(openwink-mcu-platformio)


target_include_directories(openwink-mcu-platformio
  PUBLIC include
)