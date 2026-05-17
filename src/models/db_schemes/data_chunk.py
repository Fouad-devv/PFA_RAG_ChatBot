from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from bson.objectid import ObjectId


class DataChunk(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    chunk_text: str = Field(..., min_length=1)
    chunk_metadata: dict
    chunk_order: int = Field(..., gt=0)
    chunk_asset_id: ObjectId

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def get_indexes(cls):
        return [
            {
                "key": [("chunk_asset_id", 1)],
                "name": "chunk_asset_id_index_1",
                "unique": False,
            }
        ]


class RetrievedDocument(BaseModel):
    text: str
    score: float
    record_id: Optional[Any] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
