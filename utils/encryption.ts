import * as crypto from "crypto";

// Helper function to convert Buffer to Base64
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

// Helper function to convert Base64 to Buffer
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

// Function to derive a key using PBKDF2 from a password and salt
export function deriveKey(password: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

// Encrypts the given plaintext using AES-256-CBC with PBKDF2 key derivation
export function encrypt(plaintext: string, key: any): string {
  const iv = crypto.randomBytes(16); // Generate a random IV
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const ivBase64 = bufferToBase64(iv);
  return `${ivBase64}:${encrypted}`; // Return IV and encrypted data in Base64
}

// Decrypts the given ciphertext using AES-256-CBC with PBKDF2 key derivation
export function decrypt(
  ciphertext: any,
  ivBase64: any,
  keyBase64: string
): string {
  const iv = base64ToBuffer(ivBase64);
  const key = base64ToBuffer(keyBase64); // Assuming the key is provided as a Base64 string

  // Assuming ciphertext is also provided as a Base64-encoded string
  const encryptedText = base64ToBuffer(ciphertext);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = Buffer.concat([
    decipher.update(encryptedText), // "base64" removed as input is now a buffer
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
