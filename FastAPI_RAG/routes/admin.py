import logging

from fastapi import APIRouter, File, Query, Request, UploadFile, status
from fastapi.responses import JSONResponse

from controllers.AdminController import AdminController
from controllers.NLPController import NLPController

logger = logging.getLogger("uvicorn.error")

admin_router = APIRouter(prefix="/admin", tags=["admin"])


def _admin(request: Request) -> AdminController:
    return AdminController(
        vectordb_client=request.app.vectordb_client,
        embedding_client=request.app.embedding_client,
    )


def _nlp(request: Request) -> NLPController:
    return NLPController(
        vectordb_client=request.app.vectordb_client,
        generation_client=request.app.generation_client,
        embedding_client=request.app.embedding_client,
    )


@admin_router.get("/stats")
def get_stats(request: Request):
    return _admin(request).get_stats()


@admin_router.get("/documents")
def list_documents(request: Request):
    docs = _admin(request).list_documents()
    return {"documents": docs}


@admin_router.delete("/documents/{filename:path}")
def delete_document(filename: str, request: Request):
    count = _admin(request).delete_document(filename)
    return {"deleted_chunks": count, "source": filename}


@admin_router.get("/chunks")
def list_chunks(
    request: Request,
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return _admin(request).list_chunks(search=search, page=page, limit=limit)


@admin_router.delete("/chunks/{chunk_id}")
def delete_chunk(chunk_id: str, request: Request):
    ok = _admin(request).delete_chunk(chunk_id)
    if not ok:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Chunk not found"},
        )
    return {"deleted": chunk_id}


@admin_router.post("/upload")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only PDF files are accepted"},
        )
    pdf_bytes = await file.read()
    result = _admin(request).upload_and_ingest(
        filename=file.filename,
        pdf_bytes=pdf_bytes,
        nlp_controller=_nlp(request),
    )
    if "error" in result:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=result)
    return result


@admin_router.post("/reingest")
def reingest_all(request: Request):
    result = _admin(request).reingest_all(nlp_controller=_nlp(request))
    if "error" in result:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST, content=result
        )
    return result
