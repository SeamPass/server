import * as crypto from "crypto";

// Function to derive a key using PBKDF2 from a password and salt
function deriveKey(password: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

// Encrypts the given plaintext using AES-256-CBC with PBKDF2 key derivation
export function encrypt(
  plaintext: string,
  password: string,
  userSalt: string
): string {
  const iv = crypto.randomBytes(16); // Generate a random IV
  const key = deriveKey(password, userSalt); // Derive key using PBKDF2
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`; // Return IV and encrypted data
}

// Decrypts the given ciphertext using AES-256-CBC with PBKDF2 key derivation
export function decrypt(
  ciphertext: string,
  password: string,
  userSalt: string
): string {
  const parts = ciphertext.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");

  const key = deriveKey(password, userSalt); // Derive key using PBKDF2
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}
