import { USER_ROLES } from "../_lib/auth.js";
import { requireRole } from "../_lib/route-guards.js";
import { getFreelancerById } from "../../shared/customerMarketplace.js";

const VALID_INTENTS = new Set(["contact", "hire"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to contact or hire a freelancer." });
  }

  try {
    const user = await requireRole(req, res, USER_ROLES.CUSTOMER);

    if (!user) {
      return undefined;
    }

    const freelancerId = String(req.body?.freelancerId || "").trim();
    const intent = String(req.body?.intent || "").trim().toLowerCase();
    const freelancer = getFreelancerById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({ error: "Selected freelancer was not found." });
    }

    if (!VALID_INTENTS.has(intent)) {
      return res.status(400).json({ error: "Select a valid hiring action." });
    }

    return res.status(200).json({
      message:
        intent === "contact"
          ? `Conversation started with ${freelancer.name}.`
          : `Hiring request sent to ${freelancer.name}.`,
      request: {
        freelancerId: freelancer.id,
        freelancerName: freelancer.name,
        intent,
        pricingType: freelancer.pricingType,
        price: freelancer.price,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not submit the hiring request.",
    });
  }
}
