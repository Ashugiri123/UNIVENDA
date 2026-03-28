import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_NAME = "univenda_auth";

export const USER_ROLES = {
  SELLER: "seller",
  CUSTOMER: "customer",
  STUDENT: "student",
  ADMIN: "admin",
};

export const STUDENT_CAPABILITIES = {
  PRODUCT_SELLING: "product_selling",
  FREELANCING: "freelancing",
};

const SUPPORTED_ROLES = new Set(Object.values(USER_ROLES));

export const VERIFICATION_STATUSES = {
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
};

function getAuthSecret() {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_JWT_SECRET. Add it to enable authentication.");
  }

  return secret;
}

function getSensitiveDataSecret() {
  const secret = process.env.AUTH_DATA_SECRET || process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_DATA_SECRET or AUTH_JWT_SECRET. Add one to protect sensitive registration data.");
  }

  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlEncodeBuffer(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function signToken(unsignedToken, secret) {
  return base64UrlEncodeBuffer(createHmac("sha256", secret).update(unsignedToken).digest());
}

function normalizeCapabilities(capabilities) {
  if (!Array.isArray(capabilities)) {
    return [];
  }

  return [...new Set(capabilities.map((value) => String(value || "").trim()).filter(Boolean))];
}

function deriveEncryptionKey(secret) {
  return createHash("sha256").update(secret).digest();
}

export function getDefaultStudentCapabilities() {
  return [STUDENT_CAPABILITIES.PRODUCT_SELLING, STUDENT_CAPABILITIES.FREELANCING];
}

export function validateRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (!SUPPORTED_ROLES.has(normalizedRole)) {
    return {
      valid: false,
      error: `Unsupported role. Allowed roles: ${[...SUPPORTED_ROLES].join(", ")}.`,
    };
  }

  return {
    valid: true,
    role: normalizedRole,
  };
}

export function validateCredentials({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    return { valid: false, error: "Email and password are required." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return { valid: false, error: "Enter a valid email address." };
  }

  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  return {
    valid: true,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, key] = storedHash.split(":");
  const storedKey = Buffer.from(key, "hex");
  const derivedKey = await scrypt(password, salt, storedKey.length);

  return timingSafeEqual(storedKey, Buffer.from(derivedKey));
}

export function encryptSensitiveField(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const iv = randomBytes(12);
  const key = deriveEncryptionKey(getSensitiveDataSecret());
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = typeof value === "string" ? value : JSON.stringify(value);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
    value: encrypted.toString("base64"),
  };
}

export function decryptSensitiveField(payload) {
  if (!payload?.iv || !payload?.tag || !payload?.value) {
    return null;
  }

  try {
    const key = deriveEncryptionKey(getSensitiveDataSecret());
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.value, "base64")),
      decipher.final(),
    ]).toString("utf8");

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch {
    return null;
  }
}

export function createAuthToken(user) {
  const secret = getAuthSecret();
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      capabilities: normalizeCapabilities(user.capabilities),
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = signToken(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  try {
    const secret = getAuthSecret();
    const [header, payload, signature] = token.split(".");

    if (!header || !payload || !signature) {
      return null;
    }

    const unsignedToken = `${header}.${payload}`;
    const expectedSignature = signToken(unsignedToken, secret);
    const providedSignature = Buffer.from(signature);
    const computedSignature = Buffer.from(expectedSignature);

    if (providedSignature.length !== computedSignature.length) {
      return null;
    }

    if (!timingSafeEqual(providedSignature, computedSignature)) {
      return null;
    }

    const parsedPayload = JSON.parse(base64UrlDecode(payload));

    if (typeof parsedPayload.exp !== "number" || parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

export function readAuthTokenFromRequest(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
      }),
  );

  return cookies[COOKIE_NAME] || null;
}

export function setAuthCookie(res, token) {
  const cookie = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, "HttpOnly", "Path=/", "SameSite=Strict", `Max-Age=${TOKEN_TTL_SECONDS}`];

  if (process.env.NODE_ENV === "production") {
    cookie.push("Secure");
  }

  res.setHeader("Set-Cookie", cookie.join("; "));
}

export function clearAuthCookie(res) {
  const cookie = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/", "SameSite=Strict", "Max-Age=0"];

  if (process.env.NODE_ENV === "production") {
    cookie.push("Secure");
  }

  res.setHeader("Set-Cookie", cookie.join("; "));
}

export function sanitizeUser(userRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    role: userRow.role,
    fullName: userRow.full_name || "",
    phoneNumber: userRow.phone_number || "",
    verificationStatus: userRow.verification_status || VERIFICATION_STATUSES.UNVERIFIED,
    capabilities: normalizeCapabilities(userRow.capabilities),
    createdAt: userRow.created_at,
  };
}
