import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),

  jwtAccessExpiresIn:
    (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"],

  jwtRefreshExpiresIn:
    (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"],

  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  cookieSecure: process.env.COOKIE_SECURE === "true",
};