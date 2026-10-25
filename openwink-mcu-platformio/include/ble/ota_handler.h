#ifndef OTA_HANDLER_H
#define OTA_HANDLER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <stddef.h>
#include <stdint.h>

#define OTA_SIGNATURE_BLOCK_LEN 512
#define FIRMWARE_VERSION_BYTES_LEN 3
#define OTA_RESTART_DELAY_MS 3000

typedef enum OTA_CTRL_CMD : uint8_t {
    OTA_CTRL_START = 0x01,
    OTA_CTRL_DONE = 0x02,
    OTA_CTRL_HALT = 0x03,
} ota_ctrl_cmd_t;

typedef enum OTA_STATUS : uint8_t {
    OTA_STATUS_IDLE = 0,
    OTA_STATUS_UPDATING = 1,
    OTA_STATUS_ERR_FLASH_INIT = 2,
    OTA_STATUS_ERR_VERIFY_INIT = 3,
    OTA_STATUS_ERR_INVALID_SIZE = 4,
    OTA_STATUS_ERR_VERIFY_SIGN = 5,
    OTA_STATUS_ERR_CHUNK_WRITE = 6,
    OTA_STATUS_SUCCESS = 7,
} ota_status_t;

#ifdef __cplusplus
extern "C" {
#endif

void init_ota();
void get_firmware_version_bytes(uint8_t out[FIRMWARE_VERSION_BYTES_LEN]);
uint8_t get_ota_status();
uint8_t get_ota_progress();
uint8_t is_ota_in_progress();

void ota_handle_control(const uint8_t* data, size_t len);
void ota_handle_chunk(const uint8_t* data, size_t len);
void ota_reset_on_disconnect();

#ifdef __cplusplus
}
#endif

#endif
