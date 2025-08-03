import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultCommandValue } from "../helper/Constants";

export interface CommandInput {
  delay?: number;
  transmitValue?: DefaultCommandValue;
}

export interface CommandOutput {
  name: string;
  command?: CommandInput[];
}

const COMMAND_STORE_KEY = "CUSTOM_COMMANDS_";

export abstract class CustomCommandStore {

  static async saveCommand(name: string, command: CommandInput[]) {
    try {
      const doesCommandExist = await AsyncStorage.getItem(`${COMMAND_STORE_KEY}_${name}`);
      if (doesCommandExist) return false;

      const commandString = command.map(value => value.delay ? `d${value.delay}` : value.transmitValue).join("-");
      await AsyncStorage.setItem(`${COMMAND_STORE_KEY}_${name}`, commandString);
    } catch (err) {
      return null;
    }
  }

  static async getAll() {
    try {
      const commandKeys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(COMMAND_STORE_KEY));
      const allCommands: CommandOutput[] = [];
      for (const commandName of commandKeys) {
        const commandNameParts = commandName.split("_");
        allCommands.push({ name: commandNameParts.slice(2, commandNameParts.length - 1).join(" "), command: [] });

        const commandFromStorage = await AsyncStorage.getItem(commandName);
        const index = allCommands.length - 1;
        if (!commandFromStorage) {
          allCommands[index].command = undefined;
          continue;
        } else {
          const commandParts = commandFromStorage.split("-");
          for (const cmdSection of commandParts) {
            if (cmdSection.startsWith("d"))
              allCommands[index].command?.push({ delay: parseFloat(cmdSection.slice(1, cmdSection.length)) });
            else
              allCommands[index].command?.push({ transmitValue: parseInt(cmdSection) });
          }
        }

      }

      return allCommands;

    } catch (err) {
      return null;
    }
  }

  static async deleteCommand(name: string) {
    try {
      await AsyncStorage.removeItem(`${COMMAND_STORE_KEY}_${name}`);
    } catch (err) {
      return null;
    }
  }

  static async deleteAll() {
    try {
      const allCommandKeys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(COMMAND_STORE_KEY));
      await AsyncStorage.multiRemove(allCommandKeys);
    } catch (err) {
      return null;
    }
  }
}