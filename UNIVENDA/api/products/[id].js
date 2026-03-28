import { STUDENT_CAPABILITIES } from "../_lib/auth.js";
import { requireCapability } from "../_lib/route-guards.js";
import { deleteProductByIdAndUser, updateProductByIdAndUser } from "../_lib/supabase.js";
import { validateProductInput } from "../_lib/validation.js";

export default async function handler(req, res) {
  try {
    const user = await requireCapability(req, res, STUDENT_CAPABILITIES.PRODUCT_SELLING);

    if (!user) {
      return undefined;
    }

    const productId = String(req.query?.id || "").trim();

    if (!productId) {
      return res.status(400).json({ error: "Product id is required." });
    }

    if (req.method === "PUT") {
      const validation = validateProductInput(req.body || {});

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const product = await updateProductByIdAndUser(productId, user.id, validation.data);

      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      return res.status(200).json({
        message: "Product listing updated.",
        item: product,
      });
    }

    if (req.method === "DELETE") {
      await deleteProductByIdAndUser(productId, user.id);
      return res.status(200).json({ message: "Product listing deleted." });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Use PUT or DELETE for a product item." });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not process the product item request.",
    });
  }
}
