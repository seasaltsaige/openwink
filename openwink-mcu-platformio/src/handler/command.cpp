#include "handler/command.h"


// All these functions should do is change states if the headlights are not already moving
void CommandHandler::request_movement(uint8_t press_count)
{
}

void CommandHandler::request_movement(HEADLIGHT_COMMAND command)
{
}


// State machine, update states accordingly and change movements
void CommandHandler::step_movement()
{
}