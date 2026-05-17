from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from bson.objectid import ObjectId
from datetime import datetime


class MessageSource(BaseModel):
    file: Optional[str] = None
    page: Optional[int] = None
    chunk_text: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Message(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    discussion_id: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    sources: List[MessageSource] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("discussion_id", 1), ("created_at", 1)],
                "name": "message_discussion_created_index_1",
                "unique": False,
            }
        ]
