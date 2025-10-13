#include <NimBLEDevice.h>
#include <driver/gpio.h>

extern "C" void app_main()
{
    NimBLEDevice::init("Device");
}