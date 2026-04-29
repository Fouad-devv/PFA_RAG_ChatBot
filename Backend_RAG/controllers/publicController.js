
// Public handler for non-authenticated users
export const handGetPublicResponse = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || (typeof message === 'string' && message.trim().length === 0)) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // For demo purposes, just return a fixed or generated answer hello world. In a real app, you'd call your AI/chat service here.
    const answer = "Hello user ! ";
    return res.json({ answer });

  } catch (err) {
    console.error("Public chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};