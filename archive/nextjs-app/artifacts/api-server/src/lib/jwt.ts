import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

function getSecret(): string {
  const secret = process.env["ACCESS_TOKEN_SECRET"];
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not configured");
  return secret;
}

function getExpiry(): string {
  return process.env["ACCESS_TOKEN_EXPIRY"] || "7d";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiry() as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
