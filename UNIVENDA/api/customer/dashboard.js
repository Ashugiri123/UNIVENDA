import { USER_ROLES } from "../_lib/auth.js";
import { requireRole } from "../_lib/route-guards.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET to read the customer dashboard." });
  }

  try {
    const user = await requireRole(req, res, USER_ROLES.CUSTOMER);

    if (!user) {
      return undefined;
    }

    return res.status(200).json({
      dashboard: "customer",
      user,
      quickStats: {
        savedAddresses: user.phoneNumber ? 1 : 0,
        activeOrders: 0,
        activeChats: 0,
      },
      capabilities: ["browse_products", "purchase_products", "hire_freelancers"],
      guidance: {
        onboarding: "Customer signup stays intentionally lightweight so buyers can start quickly.",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not load the customer dashboard.",
    });
  }
}
