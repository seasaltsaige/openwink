#include "button_bindings.h"


// check wakeup reason on boot, if not from a sleep wakeup, read from nvs to set
RTC_DATA_ATTR button_config_t button_config = { 0 };

void set_binding_at_pos(button_binding_t binding, uint8_t pos) {
}

button_binding_t get_binding_at_pos(uint8_t pos) {
}

void delete_binding_at_pos(uint8_t pos) {
}


void set_custom_button_status(uint8_t status) {
}
uint8_t get_custom_button_status() {
}

void set_custom_button_delay(uint16_t delay) {
}
uint16_t get_custom_button_delay() {
}
