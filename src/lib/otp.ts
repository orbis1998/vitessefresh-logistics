/** Hash helpers used by tests and documented for the Edge Function. Never log the raw code. */

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateNumericCode(length = 6) {
  const n = Math.pow(10, length);
  return String(Math.floor(Math.random() * (n - n / 10)) + n / 10);
}

export function otpExpired(expiresAt: string | Date, now = new Date()) {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function otpAttemptsExceeded(attempts: number, max = 5) {
  return attempts >= max;
}
