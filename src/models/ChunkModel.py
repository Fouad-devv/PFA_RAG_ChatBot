from typing import List
from bson.objectid import ObjectId
from pymongo import InsertOne, UpdateOne
from helpers.lang import detect_language
from .BaseDataModel import BaseDataModel
from .db_schemes import DataChunk
from .enums.DataBaseEnum import DataBaseEnum


class ChunkModel(BaseDataModel):

    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_CHUNK_NAME.value]

    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_CHUNK_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_CHUNK_NAME.value]
            for index in DataChunk.get_indexes():
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"],
                )

    async def get_chunk(self, chunk_id: str):
        result = await self.collection.find_one({"_id": ObjectId(chunk_id)})
        if result is None:
            return None
        return DataChunk(**result)

    async def insert_many_chunks(self, chunks: List[DataChunk], batch_size: int = 100) -> int:
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            operations = [
                InsertOne(chunk.model_dump(by_alias=True, exclude_none=True))
                for chunk in batch
            ]
            await self.collection.bulk_write(operations)
        return len(chunks)

    async def delete_all_chunks(self) -> int:
        result = await self.collection.delete_many({})
        return result.deleted_count

    async def get_all_chunks(self, page_no: int = 1, page_size: int = 50) -> List[DataChunk]:
        records = await self.collection.find({}) \
            .skip((page_no - 1) * page_size) \
            .limit(page_size) \
            .to_list(length=None)
        return [DataChunk(**record) for record in records]

    async def backfill_languages(self, overwrite: bool = False,
                                 batch_size: int = 200) -> dict:
        """Stamp `chunk_metadata.language` on every chunk in the collection.

        With ``overwrite=False`` (default) only chunks missing a valid
        language are touched, so this is safe to re-run.
        """
        query = {} if overwrite else {
            "chunk_metadata.language": {"$nin": ["ar", "fr"]}
        }

        scanned = 0
        updated = 0
        by_language = {"ar": 0, "fr": 0}
        pending: List[UpdateOne] = []

        cursor = self.collection.find(
            query, {"_id": 1, "chunk_text": 1}
        ).batch_size(batch_size)

        async for doc in cursor:
            scanned += 1
            lang = detect_language(doc.get("chunk_text", ""))
            by_language[lang] += 1
            pending.append(UpdateOne(
                {"_id": doc["_id"]},
                {"$set": {"chunk_metadata.language": lang}},
            ))

            if len(pending) >= batch_size:
                result = await self.collection.bulk_write(pending)
                updated += result.modified_count
                pending = []

        if pending:
            result = await self.collection.bulk_write(pending)
            updated += result.modified_count

        return {
            "scanned": scanned,
            "updated": updated,
            "by_language": by_language,
        }
