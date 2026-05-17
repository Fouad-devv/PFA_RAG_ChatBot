import asyncio
import json
import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from controllers import NLPController
from .schemes.nlp import QueryRequest, IngestRequest

logger = logging.getLogger("uvicorn.error")

nlp_router = APIRouter(tags=["nlp"])


def _get_controller(request: Request) -> NLPController:
    return NLPController(
        vectordb_client=request.app.vectordb_client,
        generation_client=request.app.generation_client,
        embedding_client=request.app.embedding_client,
    )


@nlp_router.post("/rag")
def rag_query(request: Request, req: QueryRequest):
    controller = _get_controller(request)
    answer, retrieved = controller.answer_rag_question(query=req.question, limit=req.top_k)

    if not answer:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No answer found — no relevant documents retrieved"},
        )

    return {
        "answer": answer,
        "sources": [
            {
                "text": doc.text,
                "source": doc.metadata.get("source", ""),
                "score": doc.score,
            }
            for doc in retrieved
        ],
    }


@nlp_router.post("/rag/stream")
def rag_stream(request: Request, req: QueryRequest):
    controller = _get_controller(request)

    def sse(event: str, data) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue = asyncio.Queue()
        SENTINEL = object()

        def producer():
            try:
                for kind, payload in controller.answer_rag_question_stream(
                    query=req.question, limit=req.top_k
                ):
                    loop.call_soon_threadsafe(queue.put_nowait, (kind, payload))
            except Exception as exc:
                logger.exception("Streaming RAG failed")
                loop.call_soon_threadsafe(queue.put_nowait, ("error", str(exc)))
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)

        worker = loop.run_in_executor(None, producer)

        try:
            while True:
                item = await queue.get()
                if item is SENTINEL:
                    break
                kind, payload = item
                if kind == "greeting":
                    yield sse("greeting", {"text": payload})
                elif kind == "sources":
                    yield sse("sources", {
                        "sources": [
                            {"text": d.text, "source": d.metadata.get("source", ""), "score": d.score}
                            for d in payload
                        ]
                    })
                elif kind == "token":
                    yield sse("token", {"text": payload})
                elif kind == "done":
                    yield sse("done", {"signal": "success"})
                elif kind == "error":
                    yield sse("error", {"detail": payload})
        finally:
            await worker

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@nlp_router.post("/ingest")
def ingest(request: Request, req: IngestRequest):
    if not req.chunks:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No chunks provided"},
        )

    controller = _get_controller(request)
    metadata_list = [{"source": req.source} for _ in req.chunks]
    ok = controller.index_into_vector_db(texts=req.chunks, metadata_list=metadata_list)

    if not ok:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Ingest failed"},
        )

    return {"inserted": len(req.chunks), "source": req.source}
