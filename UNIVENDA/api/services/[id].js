import { STUDENT_CAPABILITIES } from "../_lib/auth.js";
import { requireCapability } from "../_lib/route-guards.js";
import { deleteServiceByIdAndUser, updateServiceByIdAndUser } from "../_lib/supabase.js";
import { validateServiceInput } from "../_lib/validation.js";

export default async function handler(req, res) {
  try {
    const user = await requireCapability(req, res, STUDENT_CAPABILITIES.FREELANCING);

    if (!user) {
      return undefined;
    }

    const serviceId = String(req.query?.id || "").trim();

    if (!serviceId) {
      return res.status(400).json({ error: "Service id is required." });
    }

    if (req.method === "PUT") {
      const validation = validateServiceInput(req.body || {});

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const service = await updateServiceByIdAndUser(serviceId, user.id, validation.data);

      if (!service) {
        return res.status(404).json({ error: "Service not found." });
      }

      return res.status(200).json({
        message: "Freelance service updated.",
        item: service,
      });
    }

    if (req.method === "DELETE") {
      await deleteServiceByIdAndUser(serviceId, user.id);
      return res.status(200).json({ message: "Freelance service deleted." });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Use PUT or DELETE for a service item." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not process the service item request.",
    });
  }
}
