cmake_minimum_required(VERSION 3.16.0)
set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/version.txt")
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(openwink-mcu-platformio)