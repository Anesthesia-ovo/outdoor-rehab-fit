import path from "node:path";

export function readConfig(env = process.env) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  const jwtSecret = env.JWT_SECRET || "development-only-secret-change-before-production";
  if (env.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }

  const smsMode = env.SMS_MODE || "mock";
  if (!new Set(["mock", "twilio"]).has(smsMode)) {
    throw new Error("SMS_MODE must be either mock or twilio");
  }

  const twilio = {
    accountSid: env.TWILIO_ACCOUNT_SID || "",
    apiKeySid: env.TWILIO_API_KEY_SID || "",
    apiKeySecret: env.TWILIO_API_KEY_SECRET || "",
    verifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID || "",
  };
  if (smsMode === "twilio" && (!twilio.apiKeySid || !twilio.apiKeySecret || !twilio.verifyServiceSid)) {
    throw new Error("Twilio Verify credentials are required when SMS_MODE=twilio");
  }

  return {
    port,
    jwtSecret,
    databasePath: path.resolve(env.DATABASE_PATH || "./data/outdoor-fit.sqlite"),
    smsMode,
    twilio,
  };
}
