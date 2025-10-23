#ifndef __WAKEUP_HANDLE
#define __WAKEUP_HANDLE
#include <stdint.h>

void INIT_wakeup_sources();
void INIT_wakeup_sources(bool disable_gpio, uint64_t sleep_time);

#endif