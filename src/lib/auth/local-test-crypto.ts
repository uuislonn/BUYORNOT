import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
export function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password: string, salt: string, hash: string) {
  if (password.length > 128 || !/^[a-f0-9]{128}$/.test(hash)) return false;
  return timingSafeEqual(
    Buffer.from(passwordHash(password, salt), "hex"),
    Buffer.from(hash, "hex"),
  );
}
export function sessionToken(id: string, secret: string, expires: number) {
  const payload = Buffer.from(JSON.stringify({ id, expires })).toString(
    "base64url",
  );
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function sessionIdentity(
  token: string,
  secret: string,
  now: number,
): string | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !/^[a-f0-9]{64}$/.test(signature))
    return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.id === "string" &&
      typeof data.expires === "number" &&
      data.expires > now
      ? data.id
      : null;
  } catch {
    return null;
  }
}
