import os
from pymongo import MongoClient

_client = None


def get_collection():
    global _client
    if _client is None:
        _client = MongoClient(os.getenv("MONGO_URI"))
    db = _client[os.getenv("MONGO_DB", "PFE")]
    return db["documents"]



#_________________________________________________________________

def vector_search(query_vector: list[float], top_k: int = 5, min_score: float = 0.4) -> list[dict]:
    collection = get_collection()
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": top_k * 15,
                "limit": top_k,
            }
        },
        {
            "$project": {
                "_id": 0,
                "content": 1,
                "source": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
        {
            "$match": {"score": {"$gte": min_score}}
        },
    ]
    return list(collection.aggregate(pipeline))


#___________________________________________________________________________

def insert_chunks(chunks: list[str], vectors: list[list[float]], source: str) -> int:
    collection = get_collection()
    docs = [
        {"content": chunk, "embedding": vector, "source": source}
        for chunk, vector in zip(chunks, vectors)
    ]
    result = collection.insert_many(docs)
    return len(result.inserted_ids)
