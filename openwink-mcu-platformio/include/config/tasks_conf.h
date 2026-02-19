#ifndef __TASKS_INIT
#define __TASKS_INIT

void INIT_tasks();

void button_task(void*);
void update_headlight_state_task(void*);
void poll_headlight_status_task(void*);
void button_task(void*);

#endif