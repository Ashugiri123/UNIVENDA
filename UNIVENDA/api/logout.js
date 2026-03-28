import { clearAuthCookie } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for logout." });
  }

  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
}
