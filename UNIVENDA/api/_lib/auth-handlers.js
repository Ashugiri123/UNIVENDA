import {
  createAuthToken,
  getDefaultStudentCapabilities,
  hashPassword,
  sanitizeUser,
  setAuthCookie,
  USER_ROLES,
  validateRole,
  verifyPassword,
} from "./auth.js";
import { createUser, findUserByEmail } from "./supabase.js";
import {
  validateCredentials,
  validateCustomerRegistration,
  validateSellerRegistration,
} from "./validation.js";

function buildRedirectPath(role) {
  if (role === USER_ROLES.CUSTOMER) {
    return "/customer/dashboard";
  }

  if (role === USER_ROLES.SELLER || role === USER_ROLES.STUDENT) {
    return "/seller/dashboard";
  }

  return "/dashboard";
}

function getRegistrationValidation(role, body) {
  if (role === USER_ROLES.CUSTOMER) {
    return validateCustomerRegistration(body);
  }

  if (role === USER_ROLES.SELLER || role === USER_ROLES.STUDENT) {
    return validateSellerRegistration(body);
  }

  return validateCredentials(body);
}

export function createSignupHandler(options = {}) {
  const configuredRole = options.role || USER_ROLES.SELLER;
  const configuredCapabilities =
    options.capabilities ||
    (configuredRole === USER_ROLES.CUSTOMER ? [] : getDefaultStudentCapabilities());

  return async function signupHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Use POST for registration." });
    }

    const roleValidation = validateRole(configuredRole);
    if (!roleValidation.valid) {
      return res.status(400).json({ error: roleValidation.error });
    }

    const validation = getRegistrationValidation(roleValidation.role, req.body || {});
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const existingUser = await findUserByEmail(validation.email);
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await hashPassword(validation.password);
      const user = await createUser({
        email: validation.email,
        passwordHash,
        role: roleValidation.role,
        capabilities: configuredCapabilities,
        profile: validation.data || {},
      });

      const safeUser = sanitizeUser(user);
      const token = createAuthToken(safeUser);
      setAuthCookie(res, token);

      return res.status(201).json({
        message:
          roleValidation.role === USER_ROLES.CUSTOMER
            ? "Customer account created successfully."
            : "Student seller account created successfully.",
        user: safeUser,
        redirectTo: buildRedirectPath(roleValidation.role),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Registration failed." });
    }
  };
}

export function createLoginHandler(options = {}) {
  const configuredRole = options.role || USER_ROLES.SELLER;

  return async function loginHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Use POST for login." });
    }

    const roleValidation = validateRole(configuredRole);
    if (!roleValidation.valid) {
      return res.status(400).json({ error: roleValidation.error });
    }

    const validation = validateCredentials(req.body || {});
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const user = await findUserByEmail(validation.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      if (user.role !== roleValidation.role) {
        return res.status(403).json({ error: `This account is registered as ${user.role}.` });
      }

      const passwordMatches = await verifyPassword(validation.password, user.password_hash);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const safeUser = sanitizeUser(user);
      const token = createAuthToken(safeUser);
      setAuthCookie(res, token);

      return res.status(200).json({
        message: "Login successful.",
        user: safeUser,
        redirectTo: buildRedirectPath(roleValidation.role),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Login failed." });
    }
  };
}
