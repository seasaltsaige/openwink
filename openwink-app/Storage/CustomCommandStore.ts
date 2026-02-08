import {CommandInput, CommandOutput} from '../helper/Types';

import Storage from './Storage';


const COMMAND_STORE_KEY = 'CUSTOM_COMMANDS';

export abstract class CustomCommandStore {
  static saveCommand(name: string, command: CommandInput[]): null|void {
    const doesCommandExist = Storage.getString(`${COMMAND_STORE_KEY}_${name}`);
    // Can not save multiple commands with the same name
    if (doesCommandExist !== undefined) return null;

    const commandString =
        command
            .map(value => value.delay ? `d${value.delay}` : value.transmitValue)
            .join('-');
    Storage.set(`${COMMAND_STORE_KEY}_${name}`, commandString);
  }

  static editCommand(
      oldName: string, newName: string, command: CommandInput[]) {
    // Just delete the old one, in case the new one
    CustomCommandStore.deleteCommand(`${COMMAND_STORE_KEY}_${oldName}`);

    const commandString =
        command
            .map(value => value.delay ? `d${value.delay}` : value.transmitValue)
            .join('-');
    Storage.set(`${COMMAND_STORE_KEY}_${newName}`, commandString);
  }

  static getAll() {
    const commandKeys =
        Storage.getAllKeys().filter(key => key.startsWith(COMMAND_STORE_KEY));
    const allCommands: CommandOutput[] = [];
    for (const commandName of commandKeys) {
      const commandNameParts = commandName.split('_');
      allCommands.push(
          {name: commandNameParts.slice(2).join(' '), command: []});

      const commandFromStorage = Storage.getString(commandName);
      const index = allCommands.length - 1;
      if (!commandFromStorage) {
        allCommands[index].command = undefined;
        continue;
      } else {
        const commandParts = commandFromStorage.split('-');
        for (const cmdSection of commandParts) {
          if (cmdSection.startsWith('d'))
            allCommands[index].command?.push(
                {delay: parseFloat(cmdSection.slice(1, cmdSection.length))});
          else
            allCommands[index].command?.push(
                {transmitValue: parseInt(cmdSection)});
        }
      }
    }
    return allCommands;
  }

  static get(name: string) {
    const cmdString = Storage.getString(`${COMMAND_STORE_KEY}_${name}`);
    if (!cmdString) return null;

    const command: CommandOutput = {
      name,
      command: [],
    }

    const parts = cmdString.split('-');
    for (const part of parts) {
      if (part.startsWith('d'))
        command.command?.push({delay: parseFloat(part.slice(1, part.length))});
      else
        command.command?.push({transmitValue: parseInt(part)});
    }

    return command;
  }

  static deleteCommand(name: string) {
    Storage.delete(`${COMMAND_STORE_KEY}_${name}`);
  }

  static deleteAll() {
    const allCommandKeys =
        Storage.getAllKeys().filter(key => key.startsWith(COMMAND_STORE_KEY));
    for (const key of allCommandKeys) Storage.delete(key);
  }


  static getKeys(cb: ((key: string) => boolean)) {
    const commandKeys =
        Storage.getAllKeys().filter(key => key.startsWith(COMMAND_STORE_KEY));

    console.log(commandKeys)

    return commandKeys.filter(cb);
  }
}