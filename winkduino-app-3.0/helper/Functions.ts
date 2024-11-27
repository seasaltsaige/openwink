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