/**
 * POST /api/v1/feedback — logs feedback for server-side review.
 * The client also opens a mailto: to the site owner so email works without SMTP.
 */
export async function submitFeedback(req, res) {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const replyEmail =
      typeof req.body?.replyEmail === "string" ? req.body.replyEmail.trim() : "";
    const pageUrl = typeof req.body?.pageUrl === "string" ? req.body.pageUrl.trim() : "";

    if (!message || message.length > 12000) {
      return res.status(400).json({ ok: false, error: "Message is required (max 12000 chars)." });
    }

    const line = {
      at: new Date().toISOString(),
      replyEmail: replyEmail || null,
      pageUrl: pageUrl || null,
      messagePreview: message.slice(0, 500),
      messageLength: message.length,
    };
    console.log("[feedback]", JSON.stringify(line));
    console.log("[feedback body]\n", message);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[feedback]", e);
    return res.status(500).json({ ok: false, error: "Server error." });
  }
}
