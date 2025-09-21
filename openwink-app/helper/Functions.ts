import { useCallback, useRef } from "react";
import Storage from "../Storage/Storage";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
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


export const getDeviceUUID = () => {
  const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let uuidValue = Storage.getString("device-uuid");
  if (!uuidValue) {
    uuidValue = "";
    for (let i = 0; i < 15; i++)
      uuidValue += charSet.charAt(Math.floor(Math.random() * charSet.length));
    Storage.set("device-uuid", uuidValue);
  }
  return uuidValue;
}
