from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str
    top_k: int = 8


class IngestRequest(BaseModel):
    chunks: list[str]
    source: str = "unknown"
