import { STUDENT_CAPABILITIES } from "../_lib/auth.js";
import { requireCapability } from "../_lib/route-guards.js";
import { createProduct, listProductsByUser } from "../_lib/supabase.js";
import { validateProductInput } from "../_lib/validation.js";

export default async function handler(req, res) {
  try {
    const user = await requireCapability(req, res, STUDENT_CAPABILITIES.PRODUCT_SELLING);

    if (!user) {
      return undefined;
    }

    if (req.method === "GET") {
      const products = await listProductsByUser(user.id);
      return res.status(200).json({ items: products });
    }

    if (req.method === "POST") {
      const validation = validateProductInput(req.body || {});

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const product = await createProduct(user.id, validation.data);
      return res.status(201).json({
        message: "Product listing created.",
        item: product,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Use GET or POST for products." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not process the product request.",
    });
  }
}
