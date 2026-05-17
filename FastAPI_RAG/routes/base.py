from fastapi import APIRouter
from fastapi.responses import JSONResponse

base_router = APIRouter()


@base_router.get("/health")
def health():
    return JSONResponse(content={"status": "ok"})
