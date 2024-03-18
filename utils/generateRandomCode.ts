const crypto = require("crypto");

export const generateRandomCode = (length: number) => {
  const randomBytes = crypto.randomBytes(length); // 3 bytes for a 6-digit code
  const code = (
    (parseInt(randomBytes.toString("hex"), 16) % 900000) +
    100000
  ).toString();
  return code;
};

export const generateSessionIdentifier = (length: number = 32) => {
  const randomBytes = crypto.randomBytes(length);
  const identifier = randomBytes.toString("hex");
  return identifier;
};
