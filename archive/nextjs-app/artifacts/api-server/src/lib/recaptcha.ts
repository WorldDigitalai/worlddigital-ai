import { logger } from "./logger.js";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env["RECAPTCHA_SECRET_KEY"];
  if (!secret) {
    logger.warn("RECAPTCHA_SECRET_KEY not configured — skipping verification");
    return true;
  }

  try {
    const params = new URLSearchParams({ secret, response: token });
    const resp = await fetch(`${VERIFY_URL}?${params.toString()}`, { method: "POST" });
    const data = (await resp.json()) as { success: boolean; score?: number };
    return data.success === true;
  } catch (err) {
    logger.error("reCAPTCHA verification failed");
    return false;
  }
}
