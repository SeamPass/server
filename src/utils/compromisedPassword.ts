import crypto from "crypto";
import axios from "axios";

// Utility function to check password against HIBP
export async function isPasswordCompromised(
  password: string
): Promise<boolean> {
  try {
    // Hash the password using SHA-1
    const sha1Password = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1Password.substring(0, 5);
    const suffix = sha1Password.substring(5);

    // Call the HIBP API with the first 5 characters of the hash
    const response = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    const hashes = response.data.split("\r\n");

    // Check if the suffix of the password's hash is in the returned list
    return hashes.some((line: string) => {
      const [hashSuffix] = line.split(":");
      return hashSuffix === suffix;
    });
  } catch (error) {
    console.error("Error checking password against HIBP:", error);
    throw new Error("Unable to verify password security at this time.");
  }
}
