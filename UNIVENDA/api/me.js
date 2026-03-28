import { readAuthTokenFromRequest, sanitizeUser, USER_ROLES, verifyAuthToken } from "./_lib/auth.js";
import { findUserById } from "./_lib/supabase.js";

function getRedirectPath(role) {
  if (role === USER_ROLES.CUSTOMER) {
    return "/customer/dashboard";
  }

  if (role === USER_ROLES.SELLER || role === USER_ROLES.STUDENT) {
    return "/seller/dashboard";
  }

  return "/dashboard";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET to read the current session." });
  }

  try {
    const token = readAuthTokenFromRequest(req);
    const payload = verifyAuthToken(token);

    if (!payload?.sub || !payload?.email || !payload?.role) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const user = await findUserById(payload.sub);

    if (!user || user.email !== payload.email || user.role !== payload.role) {
      return res.status(401).json({ error: "Session is no longer valid." });
    }

    const safeUser = sanitizeUser(user);

    return res.status(200).json({
      user: safeUser,
      redirectTo: getRedirectPath(safeUser.role),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not validate the current session.",
    });
  }
}
