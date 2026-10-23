#include <FreeRTOSConfig.h>
#include <esp_app_desc.h>
#include <esp_ota_ops.h>
#include <esp_system.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>
#include <mbedtls/md.h>
#include <mbedtls/pk.h>
#include <mbedtls/sha256.h>
#include <stdio.h>
#include <string.h>

#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "ble/ota_handler.h"
#include "ble/ota_public_key.h"
#include "custom_command_output.h"

static const char* TAG = "OTA";

static SemaphoreHandle_t ota_lock = NULL;
static uint8_t fw_version_bytes[FIRMWARE_VERSION_BYTES_LEN] = { 1, 0, 0 };

static volatile uint8_t ota_in_progress = 0;
static volatile uint8_t ota_status = OTA_STATUS_IDLE;
static volatile uint8_t ota_progress = 0;

static const esp_partition_t* update_partition = NULL;
static esp_ota_handle_t ota_handle = 0;
static uint8_t ota_handle_valid = 0;

static uint32_t expected_total_size = 0;
static uint32_t expected_fw_size = 0;
static uint32_t bytes_received = 0;
static uint8_t last_notified_progress = 255;

static mbedtls_sha256_context sha_ctx;
static uint8_t sha_ctx_active = 0;
static uint8_t sig_buf[OTA_SIGNATURE_BLOCK_LEN];

static void set_and_notify_status(ota_status_t status) {
    ota_status = (uint8_t)status;
    ble_notify_ota_status((uint8_t)status);
}

static void cleanup_ota_session(uint8_t abort_flash) {
    if (abort_flash && ota_handle_valid) {
        esp_ota_abort(ota_handle);
    }
    ota_handle = 0;
    ota_handle_valid = 0;
    update_partition = NULL;

    if (sha_ctx_active) {
        mbedtls_sha256_free(&sha_ctx);
        sha_ctx_active = 0;
    }

    expected_total_size = 0;
    expected_fw_size = 0;
    bytes_received = 0;
    last_notified_progress = 255;
    ota_in_progress = 0;
    memset(sig_buf, 0, sizeof(sig_buf));
}

static void ota_restart_task(void* args) {
    vTaskDelay(pdMS_TO_TICKS(OTA_RESTART_DELAY_MS));
    esp_restart();
}

void init_ota() {
    if (ota_lock == NULL)
        ota_lock = xSemaphoreCreateMutex();

    const esp_app_desc_t* desc = esp_app_get_description();
    if (desc != NULL) {
        unsigned int maj = 1, min = 0, pat = 0;
        if (sscanf(desc->version, "%u.%u.%u", &maj, &min, &pat) == 3) {
            fw_version_bytes[0] = (uint8_t)(maj & 0xFF);
            fw_version_bytes[1] = (uint8_t)(min & 0xFF);
            fw_version_bytes[2] = (uint8_t)(pat & 0xFF);
        }
    }

    esp_ota_mark_app_valid_cancel_rollback();
}

void get_firmware_version_bytes(uint8_t out[FIRMWARE_VERSION_BYTES_LEN]) {
    if (out == NULL)
        return;
    memcpy(out, fw_version_bytes, FIRMWARE_VERSION_BYTES_LEN);
}

uint8_t get_ota_status() {
    return ota_status;
}

uint8_t get_ota_progress() {
    return ota_progress;
}

uint8_t is_ota_in_progress() {
    return ota_in_progress;
}

void ota_reset_on_disconnect() {
    if (ota_lock == NULL)
        return;

    xSemaphoreTake(ota_lock, portMAX_DELAY);
    if (ota_in_progress) {
        BLE_LOGW(TAG, "Client disconnected during OTA, aborting");
        cleanup_ota_session(1);
        ota_status = OTA_STATUS_IDLE;
        ota_progress = 0;
    }
    xSemaphoreGive(ota_lock);
}

void ota_handle_control(const uint8_t* data, size_t len) {
    if (data == NULL || len < 1 || ota_lock == NULL)
        return;

    xSemaphoreTake(ota_lock, portMAX_DELAY);

    uint8_t cmd = data[0];

    if (cmd == OTA_CTRL_START) {
        if (len != 5) {
            BLE_LOGE(TAG, "Invalid OTA START packet length: %u", (unsigned int)len);
            set_and_notify_status(OTA_STATUS_ERR_INVALID_SIZE);
            xSemaphoreGive(ota_lock);
            return;
        }

        // Clean up any stale session first
        cleanup_ota_session(1);

        uint32_t total_size = (uint32_t)data[1] | ((uint32_t)data[2] << 8) | ((uint32_t)data[3] << 16) | ((uint32_t)data[4] << 24);

        if (total_size <= (OTA_SIGNATURE_BLOCK_LEN + sizeof(esp_app_desc_t))) {
            BLE_LOGE(TAG, "Invalid OTA size: %lu", (unsigned long)total_size);
            set_and_notify_status(OTA_STATUS_ERR_INVALID_SIZE);
            xSemaphoreGive(ota_lock);
            return;
        }

        update_partition = esp_ota_get_next_update_partition(NULL);
        if (update_partition == NULL) {
            BLE_LOGE(TAG, "No valid OTA target partition found");
            set_and_notify_status(OTA_STATUS_ERR_FLASH_INIT);
            xSemaphoreGive(ota_lock);
            return;
        }

        uint32_t fw_size = total_size - OTA_SIGNATURE_BLOCK_LEN;
        if (fw_size > update_partition->size) {
            BLE_LOGE(TAG, "Firmware size (%lu) exceeds partition size (%lu)", (unsigned long)fw_size, (unsigned long)update_partition->size);
            set_and_notify_status(OTA_STATUS_ERR_INVALID_SIZE);
            xSemaphoreGive(ota_lock);
            return;
        }

        mbedtls_sha256_init(&sha_ctx);
        if (mbedtls_sha256_starts(&sha_ctx, 0) != 0) {
            mbedtls_sha256_free(&sha_ctx);
            BLE_LOGE(TAG, "SHA-256 context init failed");
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_INIT);
            xSemaphoreGive(ota_lock);
            return;
        }
        sha_ctx_active = 1;

        esp_err_t err = esp_ota_begin(update_partition, OTA_WITH_SEQUENTIAL_WRITES, &ota_handle);
        if (err != ESP_OK) {
            BLE_LOGE(TAG, "esp_ota_begin failed (0x%X)", (unsigned int)err);
            cleanup_ota_session(0);
            set_and_notify_status(OTA_STATUS_ERR_FLASH_INIT);
            xSemaphoreGive(ota_lock);
            return;
        }
        ota_handle_valid = 1;

        request_command_cancellation();

        expected_total_size = total_size;
        expected_fw_size = fw_size;
        bytes_received = 0;
        ota_progress = 0;
        last_notified_progress = 0;
        ota_in_progress = 1;

        BLE_LOGI(TAG, "OTA started (total=%luB, fw=%luB, part=%s)", (unsigned long)total_size, (unsigned long)fw_size, update_partition->label);
        ble_notify_ota_progress(0);
        set_and_notify_status(OTA_STATUS_UPDATING);
        xSemaphoreGive(ota_lock);
        return;
    }

    if (cmd == OTA_CTRL_HALT) {
        BLE_LOGW(TAG, "OTA halted by client");
        cleanup_ota_session(1);
        ota_progress = 0;
        ble_notify_ota_progress(0);
        set_and_notify_status(OTA_STATUS_IDLE);
        xSemaphoreGive(ota_lock);
        return;
    }

    if (cmd == OTA_CTRL_DONE) {
        if (!ota_in_progress || !ota_handle_valid) {
            BLE_LOGE(TAG, "OTA DONE received while not updating");
            xSemaphoreGive(ota_lock);
            return;
        }

        if (bytes_received != expected_total_size) {
            BLE_LOGE(TAG, "OTA size mismatch: expected %lu, received %lu", (unsigned long)expected_total_size, (unsigned long)bytes_received);
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_INVALID_SIZE);
            xSemaphoreGive(ota_lock);
            return;
        }

        uint8_t digest[32];
        if (mbedtls_sha256_finish(&sha_ctx, digest) != 0) {
            BLE_LOGE(TAG, "SHA-256 finish failed");
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_SIGN);
            xSemaphoreGive(ota_lock);
            return;
        }
        mbedtls_sha256_free(&sha_ctx);
        sha_ctx_active = 0;

        // Validate ASN.1 DER ECDSA signature header (0x30, <len>)
        size_t sig_len = (size_t)sig_buf[1] + 2;
        if (sig_buf[0] != 0x30 || sig_len < 64 || sig_len > OTA_SIGNATURE_BLOCK_LEN) {
            BLE_LOGE(TAG, "Malformed ASN.1 signature header (0x%02X, len=%u)", sig_buf[0], (unsigned int)sig_len);
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_SIGN);
            xSemaphoreGive(ota_lock);
            return;
        }

        mbedtls_pk_context pk;
        mbedtls_pk_init(&pk);
        int pk_res = mbedtls_pk_parse_public_key(&pk, OTA_PUBLIC_KEY, OTA_PUBLIC_KEY_LEN);
        if (pk_res != 0) {
            mbedtls_pk_free(&pk);
            BLE_LOGE(TAG, "Public key parse failed (-0x%04X)", (unsigned int)(-pk_res));
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_INIT);
            xSemaphoreGive(ota_lock);
            return;
        }

        int verify_res = mbedtls_pk_verify(&pk, MBEDTLS_MD_SHA256, digest, sizeof(digest), sig_buf, sig_len);
        mbedtls_pk_free(&pk);

        if (verify_res != 0) {
            BLE_LOGE(TAG, "ECDSA signature verification failed (-0x%04X)", (unsigned int)(-verify_res));
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_SIGN);
            xSemaphoreGive(ota_lock);
            return;
        }

        esp_err_t end_err = esp_ota_end(ota_handle);
        ota_handle_valid = 0;
        if (end_err != ESP_OK) {
            BLE_LOGE(TAG, "esp_ota_end failed (0x%X)", (unsigned int)end_err);
            cleanup_ota_session(0);
            set_and_notify_status(OTA_STATUS_ERR_CHUNK_WRITE);
            xSemaphoreGive(ota_lock);
            return;
        }

        esp_err_t boot_err = esp_ota_set_boot_partition(update_partition);
        if (boot_err != ESP_OK) {
            BLE_LOGE(TAG, "esp_ota_set_boot_partition failed (0x%X)", (unsigned int)boot_err);
            cleanup_ota_session(0);
            set_and_notify_status(OTA_STATUS_ERR_FLASH_INIT);
            xSemaphoreGive(ota_lock);
            return;
        }

        BLE_LOGI(TAG, "OTA verified and flashed successfully! Rebooting in %ums", OTA_RESTART_DELAY_MS);
        cleanup_ota_session(0);
        ota_progress = 100;
        ble_notify_ota_progress(100);
        set_and_notify_status(OTA_STATUS_SUCCESS);

        xTaskCreate(ota_restart_task, "OTA_RST", 2048, NULL, tskIDLE_PRIORITY + 2, NULL);
        xSemaphoreGive(ota_lock);
        return;
    }

    BLE_LOGE(TAG, "Unknown OTA control cmd: 0x%02X", cmd);
    xSemaphoreGive(ota_lock);
}

void ota_handle_chunk(const uint8_t* data, size_t len) {
    if (data == NULL || len == 0 || ota_lock == NULL)
        return;

    xSemaphoreTake(ota_lock, portMAX_DELAY);

    if (!ota_in_progress || !ota_handle_valid) {
        xSemaphoreGive(ota_lock);
        return;
    }

    if (bytes_received + len > expected_total_size) {
        BLE_LOGE(TAG, "OTA chunk overflow (%lu + %u > %lu)", (unsigned long)bytes_received, (unsigned int)len, (unsigned long)expected_total_size);
        cleanup_ota_session(1);
        set_and_notify_status(OTA_STATUS_ERR_INVALID_SIZE);
        xSemaphoreGive(ota_lock);
        return;
    }

    size_t offset = 0;

    // 1. Write firmware payload bytes [0 .. expected_fw_size) to flash & SHA-256
    if (bytes_received < expected_fw_size) {
        size_t fw_remaining = (size_t)(expected_fw_size - bytes_received);
        size_t fw_chunk_len = (len < fw_remaining) ? len : fw_remaining;

        esp_err_t write_err = esp_ota_write(ota_handle, data, fw_chunk_len);
        if (write_err != ESP_OK) {
            BLE_LOGE(TAG, "esp_ota_write failed (0x%X)", (unsigned int)write_err);
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_CHUNK_WRITE);
            xSemaphoreGive(ota_lock);
            return;
        }

        if (mbedtls_sha256_update(&sha_ctx, data, fw_chunk_len) != 0) {
            BLE_LOGE(TAG, "mbedtls_sha256_update failed");
            cleanup_ota_session(1);
            set_and_notify_status(OTA_STATUS_ERR_VERIFY_SIGN);
            xSemaphoreGive(ota_lock);
            return;
        }

        bytes_received += (uint32_t)fw_chunk_len;
        offset += fw_chunk_len;
    }

    // 2. Copy trailing signature bytes [expected_fw_size .. expected_total_size) into sig_buf
    if (offset < len) {
        size_t sig_offset = (size_t)(bytes_received - expected_fw_size);
        size_t sig_chunk_len = len - offset;

        if (sig_offset + sig_chunk_len <= OTA_SIGNATURE_BLOCK_LEN) {
            memcpy(&sig_buf[sig_offset], &data[offset], sig_chunk_len);
        }
        bytes_received += (uint32_t)sig_chunk_len;
    }

    uint8_t progress = (uint8_t)((bytes_received * 100ULL) / expected_total_size);
    if (progress != last_notified_progress) {
        last_notified_progress = progress;
        ota_progress = progress;
        ble_notify_ota_progress(progress);
    }

    xSemaphoreGive(ota_lock);
}
