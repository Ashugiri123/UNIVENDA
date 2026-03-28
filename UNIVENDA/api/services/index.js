import { STUDENT_CAPABILITIES } from "../_lib/auth.js";
import { requireCapability } from "../_lib/route-guards.js";
import { createService, listServicesByUser } from "../_lib/supabase.js";
import { validateServiceInput } from "../_lib/validation.js";

export default async function handler(req, res) {
  try {
    const user = await requireCapability(req, res, STUDENT_CAPABILITIES.FREELANCING);

    if (!user) {
      return undefined;
    }

    if (req.method === "GET") {
      const services = await listServicesByUser(user.id);
      return res.status(200).json({ items: services });
    }

    if (req.method === "POST") {
      const validation = validateServiceInput(req.body || {});

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const service = await createService(user.id, validation.data);
      return res.status(201).json({
        message: "Freelance service created.",
        item: service,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Use GET or POST for services." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not process the service request.",
    });
  }
}
