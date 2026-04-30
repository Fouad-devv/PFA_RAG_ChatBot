from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from embedder import embed, embed_batch
from retriever import vector_search, insert_chunks
from llm import chat

app = FastAPI(title="RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ─────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    top_k: int = 8

class IngestRequest(BaseModel):
    chunks: list[str]
    source: str = "unknown"


# ── RAG endpoint ───────────────────────────────────────────────────────────────

@app.post("/rag")
def rag_query(req: QueryRequest):
    # 1. Embed the question locally (no OpenAI)
    query_vector = embed(req.question)

    # 2. Retrieve the most relevant chunks from MongoDB Atlas
    chunks = vector_search(query_vector, top_k=req.top_k)

    # 3. Build context from retrieved chunks
    if chunks:
        context = "\n\n".join(
            f"[Source: {c.get('source', 'unknown')}]\n{c['content']}"
            for c in chunks
        )
    else:
        context = "Aucun document pertinent trouvé."

    # 4. System prompt with injected context
    system_prompt = (
        "Tu es un assistant expert en droit du travail marocain. "
        "On t'a fourni ci-dessous des extraits réels tirés directement du Code du Travail marocain. "
        "Ta mission est de lire ces extraits et d'expliquer leur contenu à l'utilisateur de façon claire. "
        "Appuie-toi uniquement sur ces extraits. Cite les articles quand ils apparaissent. "
        "Tu n'as pas besoin de reproduire le document entier — résume et explique ce que les extraits contiennent. "
        "Ne refuse jamais de répondre.\n\n"
        f"--- Extraits du document ---\n{context}\n--- Fin des extraits ---"
    )

    # 5. Call Groq LLM (free)
    answer = chat(system_prompt, req.question)

    return {
        "answer": answer,
        "sources": list({c.get("source") for c in chunks}),
    }


# ── Ingest endpoint ────────────────────────────────────────────────────────────

@app.post("/ingest")
def ingest(req: IngestRequest):
    if not req.chunks:
        raise HTTPException(status_code=400, detail="No chunks provided")

    # Embed all chunks locally in one batch
    vectors = embed_batch(req.chunks)

    inserted = insert_chunks(req.chunks, vectors, req.source)
    return {"inserted": inserted, "source": req.source}


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}
