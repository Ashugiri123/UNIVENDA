import { STUDENT_CAPABILITIES, USER_ROLES } from "../_lib/auth.js";
import { requireRole } from "../_lib/route-guards.js";
import { listProductsByUser, listServicesByUser } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET to read the seller dashboard." });
  }

  try {
    const user = await requireRole(req, res, USER_ROLES.SELLER);

    if (!user) {
      return undefined;
    }

    const [products, services] = await Promise.all([
      listProductsByUser(user.id),
      listServicesByUser(user.id),
    ]);

    return res.status(200).json({
      dashboard: "seller",
      user,
      quickStats: {
        productListings: products.length,
        freelanceGigs: services.length,
        totalCatalogItems: products.length + services.length,
      },
      capabilities: [STUDENT_CAPABILITIES.PRODUCT_SELLING, STUDENT_CAPABILITIES.FREELANCING],
      guidance: {
        verificationStatus: user.verificationStatus,
        onboarding: "Student sellers can log in immediately after registration while verification stays pending until reviewed.",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not load the seller dashboard.",
    });
  }
}
