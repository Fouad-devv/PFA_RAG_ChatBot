from typing import List, Optional
from .BaseDataModel import BaseDataModel
from .db_schemes import Message
from .enums.DataBaseEnum import DataBaseEnum


class MessageModel(BaseDataModel):

    def __init__(self, db_client: object):
        super().__init__(db_client=db_client)
        self.collection = self.db_client[DataBaseEnum.COLLECTION_MESSAGE_NAME.value]

    @classmethod
    async def create_instance(cls, db_client: object):
        instance = cls(db_client)
        await instance.init_collection()
        return instance

    async def init_collection(self):
        all_collections = await self.db_client.list_collection_names()
        if DataBaseEnum.COLLECTION_MESSAGE_NAME.value not in all_collections:
            self.collection = self.db_client[DataBaseEnum.COLLECTION_MESSAGE_NAME.value]
            for index in Message.get_indexes():
                await self.collection.create_index(
                    index["key"],
                    name=index["name"],
                    unique=index["unique"],
                )

    async def append_message(self, message: Message) -> Message:
        result = await self.collection.insert_one(
            message.model_dump(by_alias=True, exclude_none=True)
        )
        message.id = result.inserted_id
        return message

    async def get_history(self, discussion_id: str, limit: int = None) -> List[Message]:
        cursor = self.collection.find(
            {"discussion_id": discussion_id}
        ).sort("created_at", 1)
        records = await cursor.to_list(length=None)
        messages = [Message(**r) for r in records]
        if limit is not None:
            messages = messages[-limit:]
        return messages

    async def get_first_user_message(self, discussion_id: str) -> Optional[Message]:
        record = await self.collection.find_one(
            {"discussion_id": discussion_id, "role": "user"},
            sort=[("created_at", 1)],
        )
        if record is None:
            return None
        return Message(**record)

    async def delete_by_discussion(self, discussion_id: str) -> int:
        result = await self.collection.delete_many(
            {"discussion_id": discussion_id}
        )
        return result.deleted_count
