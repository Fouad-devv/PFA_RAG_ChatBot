from pydantic import BaseModel
from typing import Optional

class ProcessRequest(BaseModel):
    file_id: Optional[str] = None
    chunk_size: Optional[int] = 2000
    overlap_size: Optional[int] = 400
    do_reset: Optional[int] = 0