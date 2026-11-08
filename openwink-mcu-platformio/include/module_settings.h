#ifndef MODULE_SETTINGS_H
#define MODULE_SETTINGS_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <stddef.h>
#include <stdint.h>

typedef enum SETTING_FLAG : uint8_t {
    SETTING_FLAG_CUSTOM_BUTTON_STATUS = 0xBE,
    SETTING_FLAG_CUSTOM_BUTTON_DELAY = 0xAA,
    SETTING_FLAG_AUX_STATUS = 0xBB,
    SETTING_FLAG_WAVE_DELAY = 0xEE,
    SETTING_FLAG_SLEEPY_EYE = 0x99,
    SETTING_FLAG_HEADLIGHT_BYPASS = 0x88,
    SETTING_FLAG_ORIENTATION = 0xCC,
    SETTING_FLAG_LONG_TERM_SLEEP = 0x77,
    SETTING_FLAG_UNPAIR = 0x66,
    SETTING_FLAG_RESET = 0xFF,
} setting_flag_t;

typedef enum ORIENTATION : uint8_t {
    ORIENTATION_DEFAULT = 0,
    ORIENTATION_SWAPPED = 1,
} orientation_t;

#ifdef __cplusplus
extern "C" {
#endif

void init_module_settings();

// Validates and dispatches a general settings packet: [setting_flag_t][payload...]
// Returns 1 on valid/handled packet, 0 on invalid packet
uint8_t handle_general_setting(const uint8_t* data, size_t size);

void set_module_orientation(uint8_t orientation);
uint8_t get_module_orientation();

void enter_long_term_sleep();
uint8_t is_long_term_sleep_requested();
void unpair_module();
void reset_module();

#ifdef __cplusplus
}
#endif

#endif
