from pydantic import BaseModel
from typing import Optional, Literal


class PushRequest(BaseModel):
    do_reset: Optional[int] = 0


class SearchRequest(BaseModel):
    text: str
    limit: Optional[int] = 5
    language: Optional[Literal["ar", "fr"]] = "ar"


class AskRequest(BaseModel):
    text: str
    limit: Optional[int] = 5
    language: Optional[Literal["ar", "fr"]] = "ar"
