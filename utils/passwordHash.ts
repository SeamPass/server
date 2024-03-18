import * as crypto from "crypto";

const SALT_LENGTH = 16; // length of the salt in bytes
const HASH_ITERATIONS = 10000; // number of iterations for PBKDF2
const HASH_LENGTH = 64; // length of the hash in bytes

// Hash the password using PBKDF2
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      HASH_ITERATIONS,
      HASH_LENGTH,
      "sha512",
      (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey.toString("hex"));
        }
      }
    );
  });
}

// Generate a random salt
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString("hex");
}
