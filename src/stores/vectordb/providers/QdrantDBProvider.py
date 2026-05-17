import logging
from typing import Iterator, List, Optional, Tuple
from qdrant_client import QdrantClient, models
from ..VectorDBInterface import VectorDBInterface
from ..VectorDBEnums import DistanceMethodEnums
from models.db_schemes import RetrievedDocument


class QdrantDBProvider(VectorDBInterface):

    def __init__(self, db_path: str, default_vector_size: int = 768,
                 distance_method: str = None, index_threshold: int = 100):
        self.client: Optional[QdrantClient] = None
        self.db_path = db_path
        self.default_vector_size = default_vector_size
        self.index_threshold = index_threshold

        if distance_method == DistanceMethodEnums.COSINE.value:
            self.distance_method = models.Distance.COSINE
        elif distance_method == DistanceMethodEnums.DOT.value:
            self.distance_method = models.Distance.DOT
        else:
            self.distance_method = models.Distance.COSINE

        self.logger = logging.getLogger("uvicorn")

    def connect(self):
        self.client = QdrantClient(path=self.db_path)

    def disconnect(self):
        if self.client is not None:
            self.client.close()
        self.client = None

    def is_collection_existed(self, collection_name: str) -> bool:
        return self.client.collection_exists(collection_name=collection_name)

    def list_all_collections(self) -> List:
        return self.client.get_collections().collections

    def get_collection_info(self, collection_name: str) -> dict:
        if not self.is_collection_existed(collection_name):
            return {}
        return self.client.get_collection(collection_name=collection_name)

    def delete_collection(self, collection_name: str):
        if self.is_collection_existed(collection_name):
            self.logger.info(f"Deleting collection: {collection_name}")
            return self.client.delete_collection(collection_name=collection_name)
        return None

    def create_collection(self, collection_name: str, embedding_size: int,
                          do_reset: bool = False):
        if do_reset:
            self.delete_collection(collection_name=collection_name)

        if not self.is_collection_existed(collection_name):
            self.logger.info(f"Creating new Qdrant collection: {collection_name}")
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=embedding_size,
                    distance=self.distance_method,
                ),
            )
            return True
        return False

    @staticmethod
    def _build_payload(text: str, metadata: dict) -> dict:
        return {"text": text, "metadata": metadata or {}}

    def insert_one(self, collection_name: str, text: str, vector: list,
                   metadata: dict = None, record_id=None):
        if not self.is_collection_existed(collection_name):
            self.logger.error(f"Cannot insert into non-existing collection: {collection_name}")
            return False

        try:
            self.client.upsert(
                collection_name=collection_name,
                points=[
                    models.PointStruct(
                        id=record_id,
                        vector=vector,
                        payload=self._build_payload(text, metadata),
                    )
                ],
            )
        except Exception as e:
            self.logger.error(f"Error while inserting record: {e}")
            return False

        return True

    def insert_many(self, collection_name: str, texts: list, vectors: list,
                    metadata: list = None, record_ids: list = None,
                    batch_size: int = 50):
        if not self.is_collection_existed(collection_name):
            self.logger.error(f"Cannot insert into non-existing collection: {collection_name}")
            return False

        if metadata is None:
            metadata = [None] * len(texts)
        if record_ids is None:
            record_ids = list(range(len(texts)))

        for i in range(0, len(texts), batch_size):
            end = i + batch_size
            points = [
                models.PointStruct(
                    id=record_ids[j],
                    vector=vectors[j],
                    payload=self._build_payload(texts[j], metadata[j]),
                )
                for j in range(i, min(end, len(texts)))
            ]
            try:
                self.client.upsert(collection_name=collection_name, points=points)
            except Exception as e:
                self.logger.error(f"Error while inserting batch: {e}")
                return False

        return True

    def search_by_vector(self, collection_name: str, vector: list,
                         limit: int = 5,
                         filter_language: Optional[str] = None
                         ) -> Optional[List[RetrievedDocument]]:
        if not self.is_collection_existed(collection_name):
            return None

        query_filter = None
        if filter_language:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.language",
                        match=models.MatchValue(value=filter_language),
                    )
                ]
            )

        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=vector,
                limit=limit,
                with_payload=True,
                query_filter=query_filter,
            )
        except ValueError as e:
            self.logger.error(
                "Vector search failed (likely embedding/collection dimension mismatch): %s",
                e,
            )
            return None

        if not results:
            return None

        return [
            RetrievedDocument(
                text=(r.payload or {}).get("text", ""),
                score=r.score,
                record_id=r.id,
                metadata=(r.payload or {}).get("metadata") or {},
            )
            for r in results
        ]

    def iter_points(self, collection_name: str, batch_size: int = 100
                    ) -> Iterator[List[Tuple]]:
        if not self.is_collection_existed(collection_name):
            return

        offset = None
        while True:
            points, offset = self.client.scroll(
                collection_name=collection_name,
                limit=batch_size,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            if not points:
                break

            yield [
                (
                    p.id,
                    (p.payload or {}).get("text", ""),
                    (p.payload or {}).get("metadata") or {},
                )
                for p in points
            ]

            if offset is None:
                break

    def update_metadata(self, collection_name: str, point_ids: list,
                        metadata_patch: dict) -> bool:
        if not self.is_collection_existed(collection_name):
            return False
        if not point_ids or not metadata_patch:
            return True

        try:
            # Nested set: merge metadata_patch into the existing "metadata" object
            # without disturbing the sibling "text" key.
            self.client.set_payload(
                collection_name=collection_name,
                payload=metadata_patch,
                points=point_ids,
                key="metadata",
            )
        except Exception as e:
            self.logger.error(f"Error while updating metadata: {e}")
            return False
        return True
