const FASTAPI = process.env.FASTAPI_URL || "http://localhost:8000";

const proxy = async (res, fetcher) => {
  try {
    const r = await fetcher();
    const data = await r.json();
    res.status(r.status).json(data);
  } catch {
    res.status(502).json({ error: "FastAPI service unavailable" });
  }
};

export const getStats = (req, res) =>
  proxy(res, () => fetch(`${FASTAPI}/admin/stats`));

export const listDocuments = (req, res) =>
  proxy(res, () => fetch(`${FASTAPI}/admin/documents`));

export const deleteDocument = (req, res) =>
  proxy(res, () =>
    fetch(`${FASTAPI}/admin/documents/${encodeURIComponent(req.params.filename)}`, {
      method: "DELETE",
    })
  );

export const listChunks = (req, res) => {
  const params = new URLSearchParams();
  if (req.query.search) params.set("search", req.query.search);
  if (req.query.page)   params.set("page",   req.query.page);
  if (req.query.limit)  params.set("limit",  req.query.limit);
  return proxy(res, () => fetch(`${FASTAPI}/admin/chunks?${params.toString()}`));
};

export const deleteChunk = (req, res) =>
  proxy(res, () =>
    fetch(`${FASTAPI}/admin/chunks/${req.params.id}`, { method: "DELETE" })
  );

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([req.file.buffer], { type: "application/pdf" }),
      req.file.originalname
    );

    const r = await fetch(`${FASTAPI}/admin/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch {
    res.status(502).json({ error: "FastAPI service unavailable" });
  }
};

export const reingestAll = (req, res) =>
  proxy(res, () => fetch(`${FASTAPI}/admin/reingest`, { method: "POST" }));
