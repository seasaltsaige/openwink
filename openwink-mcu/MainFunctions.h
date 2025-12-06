#pragma once

bool buttonInterrupt();
void setAllOff();
void bothUp();
void leftUp();
void rightUp();
void bothDown();
void leftDown();
void rightDown();
void bothBlink();
void leftWink();
void rightWink();
void leftWave();
void rightWave();

bool isSleepy();
void sleepyEye(bool left, bool right);
void sleepyReset(bool left, bool right);
