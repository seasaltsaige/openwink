#ifndef __HANDLER_OEM_BUTTON
#define __HANDLER_OEM_BUTTON

#include "esp_attr.h"
#include "globals.h"


class OemButtonHandler
{
    private:
    static LEVEL lastButtonStatus;
    static bool customButtonEnabled;

    public:
    static void init()
    {
        lastButtonStatus = LEVEL::LOW;
        customButtonEnabled = false;
    };

    // Getters/Setters
    static LEVEL getLastButtonStatus()
    {
        return lastButtonStatus;
    };
    static void setLastButtonStatus(LEVEL status)
    {
        lastButtonStatus = status;
    }

    static bool getCustomButtonEnabled()
    {
        return customButtonEnabled;
    };
    static void setCustomButtonEnabled(bool enabled)
    {
        customButtonEnabled = enabled;
    }
};

#endif