from sentence_transformers import SentenceTransformer

_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        # Downloaded once on first run (~130MB), then cached locally
        _model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    return _model


# one vector
def embed(text: str) -> list[float]:
    return get_model().encode(text, normalize_embeddings=True).tolist()


# batch of vectors
def embed_batch(texts: list[str]) -> list[list[float]]:
    return get_model().encode(texts, normalize_embeddings=True).tolist()
