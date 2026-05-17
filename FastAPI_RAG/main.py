from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from embedder import embed, embed_batch, get_model
from retriever import vector_search, insert_chunks
from llm import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_model()  # download/cache the embedding model before accepting requests
    yield

app = FastAPI(title="RAG Service", lifespan=lifespan)

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
        "Réponds UNIQUEMENT en te basant sur les extraits du Code du Travail marocain fournis ci-dessous. "
        "Si la réponse ne se trouve pas dans ces extraits, réponds exactement : "
        "'Je ne trouve pas d'information sur ce sujet dans les documents du Code du Travail marocain.' "
        "N'utilise jamais tes connaissances générales. Cite les articles quand ils apparaissent.\n"
        "Formate ta réponse en Markdown : utilise **gras** pour les termes importants et les références d'articles, "
        "des listes à puces ou numérotées pour les énumérations, et des sauts de ligne clairs entre les sections.\n\n"
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
