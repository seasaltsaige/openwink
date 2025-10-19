#ifndef __SLEEP_HANDLER
#define __SLEEP_HANDLER

// Class which handles sleep timing
// If the device has been awake for longer than AWAKE_TIME, this class will put the device to sleep
// If a client is connected to the BLE Server, this will never put the device to sleep
class SleepHandler
{
};

#endif