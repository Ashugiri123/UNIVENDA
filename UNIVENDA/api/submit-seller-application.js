export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for application submission." });
  }

  const {
    fullName,
    email,
    university,
    rollNumber,
    department,
    offeringType,
    portfolioUrl,
    notes,
  } = req.body || {};

  if (!fullName || !email || !university || !rollNumber) {
    return res.status(400).json({
      error: "Add full name, email, university, and roll number before submitting.",
    });
  }

  const application = {
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
    university: university.trim(),
    roll_number: rollNumber.trim(),
    department: department || "",
    offering_type: offeringType || "",
    portfolio_url: portfolioUrl || null,
    notes: notes || null,
    source: "website",
  };

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(202).json({
      message:
        "Application captured by the frontend. Add Supabase credentials to persist records from this API route.",
      stored: false,
      application,
    });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/seller_applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(application),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || "Supabase rejected the insert.");
    }

    const rows = await response.json();

    return res.status(200).json({
      message: "Application saved and ready for manual review.",
      stored: true,
      id: rows[0]?.id || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "The application could not be stored in Supabase.",
    });
  }
}
