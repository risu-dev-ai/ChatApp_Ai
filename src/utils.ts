import { Message } from "./types";

// Simulates AES-256-GCM encryption
export function encryptMessage(text: string, secretKey: string): string {
  if (!text) return "";
  // Simple but reproducible custom encryption function that produces a realistic base64-like cyphertext
  const keySum = Array.from(secretKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cipher = Array.from(text).map((char, index) => {
    const code = char.charCodeAt(0);
    // XOR encryption shifted by key and index
    const encryptedCode = code ^ (keySum % 256) ^ (index % 12);
    return String.fromCharCode(encryptedCode);
  }).join("");
  
  try {
    return btoa(unescape(encodeURIComponent(cipher)));
  } catch (e) {
    return "ENC_" + Math.random().toString(36).substr(2, 9);
  }
}

// Decrypts the simulated AES payload
export function decryptMessage(encryptedBase64: string, secretKey: string): string {
  if (!encryptedBase64) return "";
  if (!encryptedBase64.startsWith("ENC_") && !isBase64(encryptedBase64)) {
    return encryptedBase64; // already decrypted or plain
  }
  
  if (encryptedBase64.startsWith("ENC_")) {
    return "[Decrypted Secret Message]";
  }

  try {
    const cipher = decodeURIComponent(escape(atob(encryptedBase64)));
    const keySum = Array.from(secretKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from(cipher).map((char, index) => {
      const code = char.charCodeAt(0);
      const decryptedCode = code ^ (keySum % 256) ^ (index % 12);
      return String.fromCharCode(decryptedCode);
    }).join("");
  } catch (e) {
    return "[Decryption Error: Invalid Key]";
  }
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

// Simulates key pair generation for End-to-End Encryption
export function generateE2EEKeys(): { publicKey: string; privateKey: string } {
  const chars = "ABCDEF0123456789";
  const generateRandomHex = (length: number) => {
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };
  
  return {
    publicKey: "BB_PUB_" + generateRandomHex(32),
    privateKey: "BB_PRIV_" + generateRandomHex(64),
  };
}

// Generate unique message/user IDs
export function generateId(prefix: string = ""): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format timestamp
export function getFormattedTime(): string {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}
