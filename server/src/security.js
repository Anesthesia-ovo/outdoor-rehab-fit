import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload, secret) {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = encode(JSON.stringify(payload));
  const unsigned = `${header}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export async function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = await scrypt(password, salt, 64);
  return {
    salt: salt.toString("base64url"),
    hash: Buffer.from(hash).toString("base64url"),
  };
}

export async function verifyPassword(password, salt, expectedHash) {
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), 64);
  const expected = Buffer.from(expectedHash, "base64url");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function signToken(user, secret, now = Date.now()) {
  return signPayload({
    sub: user.id,
    role: "user",
    profileRole: user.profile_role,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 7 * 24 * 60 * 60,
  }, secret);
}

export function signSmsVerification(phone, secret, purpose = "registration", now = Date.now()) {
  return signPayload({
    sub: phone,
    role: "sms_verification",
    purpose,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 10 * 60,
  }, secret);
}

export function verifyToken(token, secret, now = Date.now()) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || payload.exp <= Math.floor(now / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifySmsVerification(token, phone, secret, purpose = "registration", now = Date.now()) {
  const payload = verifyToken(token, secret, now);
  return payload?.role === "sms_verification"
    && payload?.purpose === purpose
    && payload?.sub === phone;
}
