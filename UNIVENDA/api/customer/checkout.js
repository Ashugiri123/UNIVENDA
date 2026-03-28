import { USER_ROLES } from "../_lib/auth.js";
import { requireRole } from "../_lib/route-guards.js";
import { getProductById } from "../../shared/customerMarketplace.js";

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }

  return quantity;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to create a checkout request." });
  }

  try {
    const user = await requireRole(req, res, USER_ROLES.CUSTOMER);

    if (!user) {
      return undefined;
    }

    const productId = String(req.body?.productId || "").trim();
    const quantity = normalizeQuantity(req.body?.quantity);
    const product = getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: "Selected product was not found." });
    }

    if (!quantity) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    if (quantity > product.inventory) {
      return res.status(400).json({ error: "Requested quantity exceeds available inventory." });
    }

    return res.status(200).json({
      message: `Checkout validated for ${quantity} x ${product.name}.`,
      orderPreview: {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not validate checkout.",
    });
  }
}
