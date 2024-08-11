import AsyncStorage from "@react-native-async-storage/async-storage";

const MAC_ADDR_KEY = "mac-addr";

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
    console.log(existingCommand);
    if (existingCommand !== null) return false;

    let commandString = "";
    for (const part of commandSequence) {
      if (part.isDelay)
        commandString += `d${part.delay}-`;
      else commandString += `${part.transmitValue}-`;
    }
    commandString = commandString.slice(0, commandString.length - 1);
    try {
      await AsyncStorage.setItem(`cmd_${commandName}`, commandString)
      return true;
    } catch (err) {
      return err;
    }
  }

  static async getAllCommands() {
    const allKeys = (await AsyncStorage.getAllKeys()).filter((v) => v !== MAC_ADDR_KEY && v !== "left-sleepy-eye" && v !== "right-sleepy-eye");
    const commands: CommandOutput[] = [];
    console.log(allKeys);

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
      await AsyncStorage.removeItem(`cmd_${commandName}`);
      return true;
    } catch (err) {
      return err;
    }
  }

  static async deleteAllCommands() {
    try {
      const allCmdKeys = (await AsyncStorage.getAllKeys()).filter((v) => v !== MAC_ADDR_KEY && v !== "left-sleepy-eye" && v !== "right-sleepy-eye");
      await AsyncStorage.multiRemove(allCmdKeys);
    } catch (err) {
      return err;
    }
  }

}