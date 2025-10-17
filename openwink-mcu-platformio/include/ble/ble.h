#ifndef __BLE
#define __BLE

#include <string>

using namespace std;

class BLE
{
  public:
    static void init(string name);

    static bool getClientConnected()
    {
        return device_connected;
    };

    static void startDevice();

  private:
    static bool device_connected;
    static void startServer();
    static void startService();
    static void startAdvertising();
    // static void
};

void INIT_nimble_device(string name);

#endif