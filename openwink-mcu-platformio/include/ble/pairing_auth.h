#ifndef PAIRING_AUTH_H
#define PAIRING_AUTH_H

#include <stdint.h>

typedef enum PAIRING_STATE : uint8_t {
    UNPAIRED,
    AUTH_WAIT_TOKEN,// token already exists in NVS, expecting app to alert

    AUTH_WAIT_ECHO,// no token exists in NVS,

    AUTH_ESTABLISHED,
} pairing_state_t;


pairing_state_t get_pairing_state();


#endif