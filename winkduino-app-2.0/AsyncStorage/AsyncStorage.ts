import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CommandInput {
  isDelay: boolean;
  delay?: number;
  transmitValue: number;
}

export interface CommandOutput {
  name: string;
  command: string;
}

export class CustomCommandStore {

  static async saveCommand(commandName: string, commandSequence: CommandInput[]) {

    const existingCommand = await AsyncStorage.getItem(commandName);
    if (existingCommand !== null) return false;

    let commandString = "";
    for (const part of commandSequence) {
      if (part.isDelay)
        commandString += `d${part.delay}-`;
      else commandString += `${part.transmitValue}`;
    }
    try {
      await AsyncStorage.setItem(commandName, commandString)
      return true;
    } catch (err) {
      return err;
    }
  }

  static async getAllCommands() {
    const allKeys = await AsyncStorage.getAllKeys();
    const commands: CommandOutput[] = [];

    for (const key of allKeys) {
      try {
        const cmdVal = await AsyncStorage.getItem(key);
        commands.push({ command: cmdVal!, name: key });
      } catch (e) { };
    }

    return commands;
  }

  static async deleteCommand(commandName: string) {
    try {
      await AsyncStorage.removeItem(commandName);
      return true;
    } catch (err) {
      return err;
    }
  }

  static async getCommand() {

  }

}