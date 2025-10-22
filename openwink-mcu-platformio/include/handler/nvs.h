#ifndef __NVS
#define __NVS

#include "nvs_flash.h"

class NVS
{
    private:
    static nvs_handle_t nvs_handle;

    public:
    static void init();
    static void open(const char* namespace_name, nvs_open_mode_t open_mode, nvs_handle_t* out_handle);
    static void close(nvs_handle_t handle);
    static void deinit();

    // TODO: Implement different needed storage attrs
};

#endif