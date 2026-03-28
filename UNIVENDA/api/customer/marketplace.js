import { USER_ROLES } from "../_lib/auth.js";
import { requireRole } from "../_lib/route-guards.js";
import {
  freelancerCategories,
  freelancers,
  productCategories,
  products,
} from "../../shared/customerMarketplace.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET to read the customer marketplace." });
  }

  try {
    const user = await requireRole(req, res, USER_ROLES.CUSTOMER);

    if (!user) {
      return undefined;
    }

    return res.status(200).json({
      user,
      products,
      freelancers,
      filters: {
        productCategories,
        freelancerCategories,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not load the customer marketplace.",
    });
  }
}
