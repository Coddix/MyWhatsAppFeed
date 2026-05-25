const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(s: string): ArrayBuffer {
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return toBase64(salt);
}

export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return toBase64(combined);
}

export async function decryptString(key: CryptoKey, payload: string): Promise<string> {
  const combined = fromBase64(payload);
  const iv = combined.slice(0, IV_BYTES);
  const ct = combined.slice(IV_BYTES);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}



const VERIFY_PLAINTEXT = "mywhatsappfeed:verify:v1";

export async function createVerifyToken(key: CryptoKey): Promise<string> {
  return encryptString(key, VERIFY_PLAINTEXT);
}

export async function checkVerifyToken(key: CryptoKey, token: string): Promise<boolean> {
  try {
    const decoded = await decryptString(key, token);
    return decoded === VERIFY_PLAINTEXT;
  } catch {
    return false;
  }
}
