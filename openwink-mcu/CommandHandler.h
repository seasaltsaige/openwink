#pragma once
#include <vector>
#include <string.h>

using namespace std;

class CommandHandler {

public:

  static void handleQueuedCommand();
  static void handleQueuedCustomCommand();
private:
  static vector<string> commandSequence;
  static void parseCustomCommand(string command);
};