from datetime import datetime
from typing import List, Optional
from .BaseDataModel import BaseDataModel
from .db_schemes import Discussion
from .enums.DataBaseEnum import DataBaseEnum


class DiscussionModel(BaseDataModel):

    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_DISCUSSION_NAME.value]

    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_DISCUSSION_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_DISCUSSION_NAME.value]
            for index in Discussion.get_indexes():
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"],
                )

    async def create_discussion(self, user_id: str) -> Discussion:
        discussion = Discussion(user_id=user_id)
        result = await self.collection.insert_one(
            discussion.model_dump(by_alias=True, exclude_none=True)
        )
        discussion.id = result.inserted_id
        return discussion

    async def get_discussion(self, discussion_id: str,
                             user_id: str) -> Optional[Discussion]:
        record = await self.collection.find_one(
            {"discussion_id": discussion_id, "user_id": user_id}
        )
        if record is None:
            return None
        return Discussion(**record)

    async def list_discussions(self, user_id: str,
                               limit: int = 50) -> List[Discussion]:
        # Skip legacy/broken rows where discussion_id is missing or null.
        cursor = (
            self.collection.find(
                {
                    "user_id": user_id,
                    "discussion_id": {"$type": "string"},
                }
            )
            .sort("updated_at", -1)
            .limit(limit)
        )
        records = await cursor.to_list(length=limit)
        return [Discussion(**r) for r in records]

    async def touch(self, discussion_id: str, user_id: str):
        await self.collection.update_one(
            {"discussion_id": discussion_id, "user_id": user_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    async def delete_discussion(self, discussion_id: str, user_id: str) -> int:
        result = await self.collection.delete_one(
            {"discussion_id": discussion_id, "user_id": user_id}
        )
        return result.deleted_count
