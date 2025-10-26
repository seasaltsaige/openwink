#ifndef __TASKS_INIT
#define __TASKS_INIT

void INIT_tasks();

void button_task(void*);
void headlight_input_task(void*);
void headlight_output_task(void*);

#endif