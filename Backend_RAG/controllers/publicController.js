
// Public streaming handler
export const handGetPublicResponseStream = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const ragRes = await fetch(`${process.env.FASTAPI_URL || "http://localhost:8000"}/rag/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const reader = ragRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const eventBlocks = buffer.split('\n\n');
      buffer = eventBlocks.pop();
      for (const block of eventBlocks) {
        if (!block.trim()) continue;
        const lines = block.split('\n');
        let eventType = '', dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
        }
        if ((eventType === 'token' || eventType === 'greeting') && dataStr) {
          try {
            const token = JSON.parse(dataStr).text || '';
            if (token) res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
          } catch {}
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Public stream error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
    else { res.write(`data: ${JSON.stringify({ type: 'error' })}\n\n`); res.end(); }
  }
};


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
      const ragRes = await fetch(`${process.env.FASTAPI_URL || "http://localhost:8000"}/rag`, {
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