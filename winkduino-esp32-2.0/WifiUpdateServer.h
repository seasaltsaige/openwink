#pragma once

#include <string.h>
#include <WebServer.h>


using namespace std;

class WifiUpdateServer {
private:
  static const char* ssid;
  static WebServer server;
  static bool wifi_enabled;
  static bool deviceConnected;

public:
  static void init() {
    ssid = "Wink Module: Update Access Point";
    wifi_enabled = false;
    deviceConnected = false;
    WebServer server(80);
  };

  static bool getWifiStatus() {
    return wifi_enabled;
  };

  static void setWifiStatus(bool status) {
    wifi_enabled = status;
  };

  static bool getDeviceConnected() {
    return deviceConnected;
  }

  static void setDeviceConnected(bool deviceStatus) {
    deviceConnected = deviceStatus;
  }

  static void startWifiService(const char* password);
  static void startHTTPClient();
  static void handleHTTPClient();
};

