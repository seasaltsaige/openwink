#ifndef __HANDLER_OEM_BUTTON
#define __HANDLER_OEM_BUTTON

class OemButtonHandler
{
  private:
    static int lastButtonStatus;
    static bool customButtonEnabled;

  public:
    static void init();

    // Getters/Setters
    static int getLastButtonStatus()
    {
        return lastButtonStatus;
    };
    static void setLastButtonStatus(int status)
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