#ifndef BLE_HANDLER_H
#define BLE_HANDLER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include <freertos/semphr.h>


#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif


#define WINK_SERVICE_UUID NimBLEUUID(0xa144c6b0, 0x5e1a, 0x4460, 0xbb923674b2f51520)
#define OTA_SERVICE_UUID NimBLEUUID(0xe24c13d7, 0xd7c7, 0x4301, 0x903a7750b09fc935)
#define MODULE_SETTINGS_SERVICE_UUID NimBLEUUID(0xcb5f7a1f, 0x59f2, 0x418e, 0xb9d1d6fc5c85a749)

#define HEADLIGHT_CHAR_UUID NimBLEUUID(0x034a383c, 0xd3e4, 0x4501, 0xb7a51c950db4f3c7)
#define HEADLIGHT_STATUS_UUID NimBLEUUID(0x8d2b7b9f, 0xc6a3, 0x4f56, 0x9f4f2dc7d7873c18)
#define CUSTOM_COMMAND_UUID NimBLEUUID(0x1313c33f, 0xe793, 0x422c, 0x8c04c82be9fe8a02)

#define OTA_UUID NimBLEUUID(0x58f93211, 0x63c5, 0x4b0b, 0xb4e6544c559417d7)
#define FIRMWARE_UUID NimBLEUUID(0x37187af3, 0xdefd, 0x46df, 0xa8de881c0b20d8b3)
#define SOFTWARE_UPDATING_CHAR_UUID NimBLEUUID(0xa0ee1ea6, 0x2b18, 0x4ae6, 0xaa870238dde7d760)
#define SOFTWARE_STATUS_CHAR_UUID NimBLEUUID(0x2d393ed3, 0xed78, 0x4d57, 0x900ad3e46296f92d)

#define CUSTOM_BUTTON_UPDATE_UUID NimBLEUUID(0x795a9433, 0xcf23, 0x4550, 0x80b570a0c9413cac)
#define PASSKEY_UUID NimBLEUUID(0xf61146f2, 0x791d, 0x4ef7, 0x95aab565097f69c2)
#define AUX_BUTTONS_UUID NimBLEUUID(0xbf3d4b2c, 0x0620, 0x4b34, 0x947437aa6cef28b9)
#define DEBUG_UUID NimBLEUUID(0x5015946c, 0x7bfb, 0x4b78, 0xb7482eeb96712164)
#define GENERAL_SETTINGS_UUID NimBLEUUID(0xbf133860, 0xe47e, 0x43e3, 0xb1edcd87a1d9cb63)


// iOS limits, just stick with that i think...
#define MAX_ATT_MTU 185
#define ATT_HEADER_LEN 3
#define LL_HEADER_LEN 4
#define MAX_LL_DATA (MAX_ATT_MTU + LL_HEADER_LEN)


#define DEVICE_NAME "OpenWink"

#define BLE_INIT_FAILURE (uint8_t)((1UL << 0) & 0xFF)
#define BLE_INIT_ALREADY_INITIALIZED (uint8_t)((1UL << 1) & 0xFF)

#define BLE_INIT_SUCCESS (uint8_t)((1UL << 7) & 0xFF)

// Packed 7-byte headlight status notification payload:
// [busy (1B), left_pos (1B), right_pos (1B), left_move_time (2B LE), right_move_time (2B LE)]
typedef struct __attribute__((packed)) {
    uint8_t busy;
    uint8_t left_pos;
    uint8_t right_pos;
    uint16_t left_move_time;
    uint16_t right_move_time;
} headlight_status_packet_t;

#define HEADLIGHT_STATUS_PACKET_LEN sizeof(headlight_status_packet_t)


typedef enum OPENWINK_STATUS : uint8_t {
    DISCONNECTED,
    CONNECTED,
    UNKNOWN,
} openwink_status_t;


#ifdef __cplusplus
#include <NimBLEDevice.h>
#include <string>

extern "C" {
#endif

extern SemaphoreHandle_t status_lock;

// nvs init must be called prior to this
uint8_t ble_init(const char* name);
void begin_advertising();
void ble_disconnect();

void set_device_status(openwink_status_t status);
openwink_status_t get_device_status();

void ble_notify_passkey(uint8_t* key, size_t size);
void ble_notify_debug(const uint8_t* data, size_t size);
void ble_notify_general_settings(const uint8_t* data, size_t size);
void ble_notify_headlight_status();
void ble_notify_ota_progress(uint8_t percent);
void ble_notify_ota_status(uint8_t status);

#ifdef __cplusplus
}
#endif


#endif
