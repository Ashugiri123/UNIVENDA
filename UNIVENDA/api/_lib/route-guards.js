import { readAuthTokenFromRequest, sanitizeUser, verifyAuthToken } from "./auth.js";
import { findUserById } from "./supabase.js";

export async function requireAuth(req, res) {
  const token = readAuthTokenFromRequest(req);
  const payload = verifyAuthToken(token);

  if (!payload?.sub || !payload?.email || !payload?.role) {
    res.status(401).json({ error: "Not authenticated." });
    return null;
  }

  const user = await findUserById(payload.sub);

  if (!user || user.email !== payload.email || user.role !== payload.role) {
    res.status(401).json({ error: "Session is no longer valid." });
    return null;
  }

  return sanitizeUser(user);
}

export async function requireRole(req, res, role) {
  const user = await requireAuth(req, res);

  if (!user) {
    return null;
  }

  if (user.role !== role) {
    res.status(403).json({
      error: `Forbidden. This route requires the ${role} role.`,
    });
    return null;
  }

  return user;
}

export async function requireCapability(req, res, capability) {
  const user = await requireAuth(req, res);

  if (!user) {
    return null;
  }

  if (!user.capabilities.includes(capability)) {
    res.status(403).json({
      error: `Forbidden. This route requires the ${capability} capability.`,
    });
    return null;
  }

  return user;
}
