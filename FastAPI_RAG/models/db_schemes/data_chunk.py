from pydantic import BaseModel, Field
from typing import Optional, Any, Dict


class DataChunk(BaseModel):
    chunk_text: str
    chunk_metadata: dict = Field(default_factory=dict)


class RetrievedDocument(BaseModel):
    text: str
    score: float
    record_id: Optional[Any] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
