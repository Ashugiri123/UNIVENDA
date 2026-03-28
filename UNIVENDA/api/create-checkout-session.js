import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for checkout session creation." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: "Missing STRIPE_SECRET_KEY. Add it before using Stripe Checkout.",
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
    const { amount, currency, productName } = req.body || {};
    const origin =
      req.headers.origin ||
      `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency || "inr",
            product_data: {
              name: productName || "Priority seller verification",
            },
            unit_amount: Number(amount || 29900),
          },
        },
      ],
      metadata: {
        source: "univenda-verification",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Stripe session creation failed.",
    });
  }
}
