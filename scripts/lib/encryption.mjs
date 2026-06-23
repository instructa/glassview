import { webcrypto } from "node:crypto";

const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

export async function encryptBytes(bytes) {
  const keyBytes = webcrypto.getRandomValues(new Uint8Array(KEY_LENGTH_BYTES));
  const ivBytes = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const key = await webcrypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, key, bytes);

  return {
    ciphertext: new Uint8Array(ciphertext),
    key: encodeBase64Url(keyBytes),
    iv: encodeBase64Url(ivBytes),
  };
}

export function encodeBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}
