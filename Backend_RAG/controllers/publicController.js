
// Public handler for non-authenticated users
export const handGetPublicResponse = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || (typeof message === 'string' && message.trim().length === 0)) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call FastAPI RAG service
    let answer;
    try {
      const ragRes = await fetch("${process.env.FASTAPI_URL || "http://localhost:8000"}/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
      });
      const ragData = await ragRes.json();
      answer = ragData.answer || "Je n'ai pas pu générer une réponse.";
    } catch {
      answer = "Le service RAG est indisponible. Veuillez réessayer.";
    }

    return res.json({ answer });

  } catch (err) {
    console.error("Public chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};