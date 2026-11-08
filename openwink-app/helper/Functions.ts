import { useRef } from "react";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import base64 from "react-native-base64";
import Storage from "../Storage/Storage";
import { DeviceUUIDStore } from "../Storage/DeviceUUIDStore";
import { BindingType, buttonBehaviorMap, DELAY_PREFIX, MAX_CUSTOM_CMD_DELAY_MS, MAX_CUSTOM_CMD_SEQUENCE_LENGTH } from "./Constants";
import { ButtonBehaviors, CommandInput, CommandOutput } from "./Types";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const bytesToBase64 = (bytes: number[] | Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] & 0xff);
  }
  return base64.encode(binary);
}

export const base64ToBytes = (encoded: string) => {
  const decoded = base64.decode(encoded);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export const encodeCustomCommandSequence = (commandSequence: CommandInput[], looped: boolean) => {
  const truncatedSequence = commandSequence.slice(0, MAX_CUSTOM_CMD_SEQUENCE_LENGTH);
  const payload: number[] = [looped ? 1 : 0, truncatedSequence.length & 0xff];
  for (const cmd of truncatedSequence) {
    if (cmd.delay && cmd.delay > 0) {
      const clampedDelay = Math.min(MAX_CUSTOM_CMD_DELAY_MS, Math.max(1, Math.round(cmd.delay)));
      payload.push(DELAY_PREFIX, clampedDelay & 0xff, (clampedDelay >> 8) & 0xff);
    } else if (cmd.transmitValue) {
      payload.push(cmd.transmitValue & 0xff);
    }
  }
  return payload;
}

export const encodeButtonBinding = (action: ButtonBehaviors | CommandOutput, looped: boolean) => {
  if (typeof action === "string") {
    return [BindingType.BUILTIN, buttonBehaviorMap[action] & 0xff];
  }
  return [
    BindingType.CUSTOM_SEQUENCE,
    ...encodeCustomCommandSequence(action.command ?? [], looped),
  ];
}
export const generatePassword = (len: number) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};':\",./<>?|\\";
  let retVal = "";
  for (let i = 0; i < len; ++i) {
    const n = charset.length;
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export const getBackgroundColor = (color: string) => {
  const rgbValue = hexToRgb(color);
  if (rgbValue) {
    const lum = (0.2126 * rgbValue.r + 0.7152 * rgbValue.g + 0.0722 * rgbValue.b) / 255;
    if (lum > 0.5)
      return "black";
    else
      return "white";
  }
}

export const isValidHex = (str: string) => {
  const hexaPattern = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
  return hexaPattern.test(str);
}

type ToProperCase<S extends string> =
  S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S;

export const toProperCase = <S extends string>(str: S): ToProperCase<S> => {
  const first = str.at(0)?.toUpperCase();
  const rest = str.slice(1);
  return `${first}${rest}` as ToProperCase<S>;
}

export const useThrottle = <T extends unknown[], K>(
  cb: (...args: T) => K,
  delay: number
) => {
  const throttle = useRef(Date.now());
  return (...args: T) => {
    if (Date.now() - throttle.current >= delay) {
      console.log(throttle.current);
      cb(...args);
      throttle.current = Date.now();
    }
  }
};


export const getDevicePasskey = () => {
  let uuidValue = DeviceUUIDStore.get();
  if (!uuidValue) uuidValue = "Not Paired";
  return uuidValue;
}

export const getRunningAppVersion = (): string => {
  const manifest = Updates.manifest as Record<string, any> | null;
  return (
    manifest?.metadata?.appVersion ??
    manifest?.extra?.expoClient?.version ??
    Application.nativeApplicationVersion ??
    "2.0.0"
  );
};


export const compareVersions = (a: string, b: string) => {
  const aParsed = a.split(".").map(v => parseInt(v));
  const bParsed = b.split(".").map(v => parseInt(v));

  for (let i = 0; i < 3; i++) {
    if (aParsed[i] < bParsed[i]) return -1;
    if (aParsed[i] > bParsed[i]) return 1;
  }

  return 0;
}