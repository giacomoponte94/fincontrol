import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { jwtVerify, SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "./env";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashed] = stored.split(":");
  if (!salt || !hashed) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashedBuf = Buffer.from(hashed, "hex");
  if (buf.length !== hashedBuf.length) return false;
  return timingSafeEqual(buf, hashedBuf);
}

export async function createSessionToken(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(ENV.jwtSecret);
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(secret);
}

export async function authenticateRequest(req: Request) {
  const rawCookies = req.headers.cookie ?? "";
  const pair = rawCookies.split(";").find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
  const token = pair?.split("=").slice(1).join("=").trim();
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const userId = parseInt(payload.sub ?? "");
    if (isNaN(userId)) return null;
    return await db.getUserById(userId);
  } catch {
    return null;
  }
}
