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
    top_k: int = 5

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
        "Tu es un assistant intelligent. Réponds à la question de l'utilisateur "
        "en te basant uniquement sur le contexte suivant.\n"
        "Si la réponse n'est pas dans le contexte, dis-le honnêtement.\n\n"
        f"Contexte :\n{context}"
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
