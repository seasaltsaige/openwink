#ifndef __WAKEUP_HANDLE
#define __WAKEUP_HANDLE
#include <stdint.h>

void enable_wakeup_sources();
void enable_wakeup_sources(bool disable_gpio, uint64_t sleep_time);

#endif