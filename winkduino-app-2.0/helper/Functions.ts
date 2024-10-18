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