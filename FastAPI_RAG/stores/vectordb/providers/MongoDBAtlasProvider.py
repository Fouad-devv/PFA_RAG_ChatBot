import logging
from typing import Iterator, List, Optional, Tuple
from pymongo import MongoClient
from ..VectorDBInterface import VectorDBInterface
from models.db_schemes import RetrievedDocument


class MongoDBAtlasProvider(VectorDBInterface):

    def __init__(self, mongo_uri: str, db_name: str, vector_index_name: str = "vector_index"):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.vector_index_name = vector_index_name
        self.client = None
        self.db = None
        self.logger = logging.getLogger(__name__)

    def connect(self):
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client[self.db_name]

    def disconnect(self):
        if self.client:
            self.client.close()
        self.client = None
        self.db = None

    def is_collection_existed(self, collection_name: str) -> bool:
        return collection_name in self.db.list_collection_names()

    def list_all_collections(self) -> List:
        return self.db.list_collection_names()

    def get_collection_info(self, collection_name: str) -> dict:
        if not self.is_collection_existed(collection_name):
            return {}
        return self.db.command("collstats", collection_name)

    def delete_collection(self, collection_name: str):
        if self.is_collection_existed(collection_name):
            self.db.drop_collection(collection_name)
            self.logger.info(f"Dropped collection: {collection_name}")
        return True

    def create_collection(self, collection_name: str, embedding_size: int, do_reset: bool = False):
        if do_reset and self.is_collection_existed(collection_name):
            self.db[collection_name].delete_many({})
            self.logger.info(f"Cleared all documents from: {collection_name}")
        if not self.is_collection_existed(collection_name):
            self.db.create_collection(collection_name)
            self.logger.info(f"Created collection: {collection_name}")
        return True

    def insert_one(self, collection_name: str, text: str, vector: list,
                   metadata: dict = None, record_id=None):
        try:
            doc = {"text": text, "embedding": vector, "metadata": metadata or {}}
            self.db[collection_name].insert_one(doc)
            return True
        except Exception as e:
            self.logger.error(f"Error inserting document: {e}")
            return False

    def insert_many(self, collection_name: str, texts: list, vectors: list,
                    metadata: list = None, record_ids: list = None, batch_size: int = 50):
        if metadata is None:
            metadata = [{}] * len(texts)

        try:
            for i in range(0, len(texts), batch_size):
                batch = [
                    {"text": texts[j], "embedding": vectors[j], "metadata": metadata[j] or {}}
                    for j in range(i, min(i + batch_size, len(texts)))
                ]
                self.db[collection_name].insert_many(batch)
            return True
        except Exception as e:
            self.logger.error(f"Error inserting batch: {e}")
            return False

    def search_by_vector(self, collection_name: str, vector: list, limit: int,
                         filter_language: Optional[str] = None,
                         min_score: float = 0.0) -> Optional[List[RetrievedDocument]]:
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.vector_index_name,
                        "path": "embedding",
                        "queryVector": vector,
                        "numCandidates": limit * 10,
                        "limit": limit,
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "text": 1,
                        "content": 1,
                        "metadata": 1,
                        "source": 1,
                        "score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
            match = {}
            if min_score > 0:
                match["score"] = {"$gte": min_score}
            if filter_language:
                match["metadata.language"] = filter_language
            if match:
                pipeline.append({"$match": match})

            results = list(self.db[collection_name].aggregate(pipeline))
            if not results:
                return None

            return [
                RetrievedDocument(
                    text=r.get("text") or r.get("content", ""),
                    score=r.get("score", 0.0),
                    metadata=r.get("metadata") or {"source": r.get("source", "")},
                )
                for r in results
            ]
        except Exception as e:
            self.logger.error(f"Vector search failed: {e}")
            return None

    def iter_points(self, collection_name: str, batch_size: int = 100) -> Iterator[List[Tuple]]:
        if not self.is_collection_existed(collection_name):
            return

        cursor = self.db[collection_name].find(
            {}, {"_id": 1, "text": 1, "metadata": 1}
        ).batch_size(batch_size)

        batch = []
        for doc in cursor:
            batch.append((str(doc["_id"]), doc.get("text", ""), doc.get("metadata", {})))
            if len(batch) >= batch_size:
                yield batch
                batch = []
        if batch:
            yield batch

    # ── Admin helpers ────────────────────────────────────────────────────────

    def list_documents_grouped(self, collection_name: str) -> list:
        pipeline = [
            {"$group": {"_id": "$metadata.source", "chunk_count": {"$sum": 1}}},
            {"$project": {"source": "$_id", "chunk_count": 1, "_id": 0}},
            {"$sort": {"source": 1}},
        ]
        return list(self.db[collection_name].aggregate(pipeline))

    def delete_by_source(self, collection_name: str, source: str) -> int:
        result = self.db[collection_name].delete_many({"metadata.source": source})
        return result.deleted_count

    def list_chunks(self, collection_name: str, search: str = None,
                    skip: int = 0, limit: int = 20) -> dict:
        query = {}
        if search:
            query["text"] = {"$regex": search, "$options": "i"}
        total = self.db[collection_name].count_documents(query)
        cursor = (
            self.db[collection_name]
            .find(query, {"embedding": 0})
            .skip(skip)
            .limit(limit)
        )
        chunks = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            chunks.append(doc)
        return {"total": total, "chunks": chunks}

    def delete_chunk_by_id(self, collection_name: str, chunk_id: str) -> bool:
        from bson import ObjectId
        result = self.db[collection_name].delete_one({"_id": ObjectId(chunk_id)})
        return result.deleted_count == 1

    def count_chunks(self, collection_name: str) -> int:
        return self.db[collection_name].count_documents({})

    def update_metadata(self, collection_name: str, point_ids: list, metadata_patch: dict) -> bool:
        if not point_ids or not metadata_patch:
            return True
        try:
            from bson import ObjectId
            object_ids = [ObjectId(pid) for pid in point_ids]
            update = {"$set": {f"metadata.{k}": v for k, v in metadata_patch.items()}}
            self.db[collection_name].update_many({"_id": {"$in": object_ids}}, update)
            return True
        except Exception as e:
            self.logger.error(f"Error updating metadata: {e}")
            return False
