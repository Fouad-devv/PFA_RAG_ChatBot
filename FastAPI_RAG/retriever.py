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

def vector_search(query_vector: list[float], top_k: int = 5) -> list[dict]:
    collection = get_collection()
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",  # the Atlas Search index you created
                "path": "embedding",      # which field to search in each document
                "queryVector": query_vector,  # the vector representation of the query
                "numCandidates": top_k * 10,  # examine 50 candidates (if top_k=5) to ensure we get the best matches
                "limit": top_k,          # return only the best 8
            }
        },
        {
            "$project": {
                "_id": 0,     # exclude the MongoDB internal ID
                "content": 1, # include the text
                "source": 1,  # include the source
                "score": {"$meta": "vectorSearchScore"},  # include similarity score
            }
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
