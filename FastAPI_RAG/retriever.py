import os
import numpy as np
from pymongo import MongoClient

_client = None
_cached_docs = None


def get_collection():
    global _client
    if _client is None:
        _client = MongoClient(os.getenv("MONGO_URI"))
    db = _client[os.getenv("MONGO_DB", "PFE")]
    return db["documents"]


def _load_docs():
    global _cached_docs
    if _cached_docs is None:
        col = get_collection()
        _cached_docs = list(col.find({}, {"content": 1, "source": 1, "embedding": 1, "_id": 0}))
    return _cached_docs


#_________________________________________________________________

def vector_search(query_vector: list[float], top_k: int = 5, min_score: float = 0.25) -> list[dict]:
    docs = _load_docs()
    if not docs:
        return []

    qv = np.array(query_vector, dtype=np.float32)
    scores = []
    for doc in docs:
        dv = np.array(doc["embedding"], dtype=np.float32)
        score = float(np.dot(qv, dv))
        if score >= min_score:
            scores.append((score, doc))

    scores.sort(key=lambda x: x[0], reverse=True)
    return [
        {"content": doc["content"], "source": doc.get("source", ""), "score": score}
        for score, doc in scores[:top_k]
    ]


#___________________________________________________________________________

def insert_chunks(chunks: list[str], vectors: list[list[float]], source: str) -> int:
    collection = get_collection()
    docs = [
        {"content": chunk, "embedding": vector, "source": source}
        for chunk, vector in zip(chunks, vectors)
    ]
    result = collection.insert_many(docs)
    return len(result.inserted_ids)
