#include "WifiUpdateServer.h"

#include <WiFi.h>
#include <Update.h>
#include <WebServer.h>
#include <ESPmDNS.h>

#include "esp_ota_ops.h"

#include "BLE.h"

using namespace std;

 
void updateProgress(size_t progress, size_t size) {
  double slope = 1.0 * (100 - 0) / (60 - 0);
  static int last_progress = -1;

  if (size > 0) {
    progress = (progress * 100) / size;
    progress = (progress > 100 ? 100 : progress);  // 0-100

    progress = 0 + slope * (progress - 0);

    if (progress != last_progress) {
      // UPDATE APP PROGRESS STATUS
      WinkduinoBLE::setFirmwarePercent(to_string(progress));
      last_progress = progress;
    }
  }
}

const char* WifiUpdateServer::ssid;
WebServer WifiUpdateServer::server;
bool WifiUpdateServer::wifi_enabled;

void WifiUpdateServer::startWifiService(const char* password) {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  MDNS.begin("module-update");
}

void WifiUpdateServer::startHTTPClient() {

  server.on(
    String("/update"), HTTP_POST,
    [&]() {
      if (Update.hasError()) {
        server.send(200);
        WinkduinoBLE::setFirmwareUpdateStatus("failed");
      } else {

        server.client().setNoDelay(true);
        server.send(200);
        WinkduinoBLE::setFirmwareUpdateStatus("success");
        delay(100);
        server.client().stop();
        esp_ota_mark_app_valid_cancel_rollback();
        ESP.restart();

      }
    },
    [&]() {
      HTTPRaw &raw = server.raw();

      if (raw.status == RAW_START) {
        uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
        if (!Update.begin(maxSketchSpace, U_FLASH)) {  // start with max available size
          Update.printError(Serial);
        } else 
          WinkduinoBLE::setFirmwareUpdateStatus("updating");

      } else if (raw.status == RAW_ABORTED || Update.hasError()) {
        if (raw.status == RAW_ABORTED) {
          
          if (!Update.end(false)) {
            Update.printError(Serial);
            WinkduinoBLE::setFirmwareUpdateStatus("failed");
          }

          Serial.println("Update was aborted");
        }
      } else if (raw.status == RAW_WRITE) {
        if (Update.write(raw.buf, raw.currentSize) != raw.currentSize) {
          Update.printError(Serial);
        }
      } else if (raw.status == RAW_END) {
        if (Update.end(true)) {  // true to set the size to the current progress
          Serial.printf("Update Success: %u\nRebooting...\n", raw.totalSize);
        } else {
          Update.printError(Serial);
        }
      }
      delay(0);
    });

  Update.onProgress(updateProgress);


  server.begin();

  MDNS.addService("http", "tcp", 80);

}

void WifiUpdateServer::handleHTTPClient() {
  server.handleClient();
}