from pydantic import BaseModel, Field
from typing import Optional
from bson.objectid import ObjectId
from datetime import datetime
import uuid


class Discussion(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    discussion_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    user_id: str = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("discussion_id", 1)],
                "name": "discussion_id_index_1",
                "unique": True,
            },
            {
                "key": [("user_id", 1), ("updated_at", -1)],
                "name": "discussion_user_updated_index_1",
                "unique": False,
            },
        ]
