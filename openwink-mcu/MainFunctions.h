#pragma once

enum WAVE_START_SIDE {
  LEFT,
  RIGHT,
};

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
void waveHeadlights(WAVE_START_SIDE side);

bool isSleepy();
void sleepyEye(bool left, bool right);
void sleepyReset(bool left, bool right);