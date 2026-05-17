import asyncio
import json
import logging
from fastapi import APIRouter, Depends, status, Request
from fastapi.responses import JSONResponse, StreamingResponse
from auth import CurrentUser, get_current_user, require_roles
from controllers import NLPController
from models import ResponseSignal
from models.ChunkModel import ChunkModel
from models.DiscussionModel import DiscussionModel
from models.MessageModel import MessageModel
from models.db_schemes import Message
from .schemes.nlp import PushRequest, SearchRequest, AskRequest

logger = logging.getLogger("uvicorn.error")

HISTORY_TURNS_FOR_CONTEXT = 6

nlp_router = APIRouter(
    prefix="/api/v1/nlp",
    tags=["api_v1", "nlp"],
)


def _build_nlp_controller(request: Request, with_template: bool = True) -> NLPController:
    return NLPController(
        vectordb_client=request.app.vectordb_client,
        generation_client=request.app.generation_client,
        embedding_client=request.app.embedding_client,
        template_parser=request.app.template_parser if with_template else None,
    )


@nlp_router.post("/index/push", dependencies=[Depends(require_roles("admin"))])
async def index_corpus(request: Request, push_request: PushRequest):
    chunk_model = await ChunkModel.create_instance(db_client=request.app.db_client)
    nlp_controller = _build_nlp_controller(request, with_template=False)

    page_no = 1
    inserted = 0
    point_id = 0
    do_reset = bool(push_request.do_reset)

    while True:
        page_chunks = await chunk_model.get_all_chunks(page_no=page_no)
        if not page_chunks:
            break
        page_no += 1

        chunk_ids = list(range(point_id, point_id + len(page_chunks)))
        point_id += len(page_chunks)

        ok = nlp_controller.index_into_vector_db(
            chunks=page_chunks,
            chunks_ids=chunk_ids,
            do_reset=do_reset,
        )
        do_reset = False

        if not ok:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"signal": ResponseSignal.INSERT_INTO_VECTORDB_ERROR.value},
            )
        inserted += len(page_chunks)

    return JSONResponse(
        content={
            "signal": ResponseSignal.INSERT_INTO_VECTORDB_SUCCESS.value,
            "inserted_items_count": inserted,
        }
    )


@nlp_router.get("/index/info", dependencies=[Depends(require_roles("admin"))])
async def get_index_info(request: Request):
    nlp_controller = _build_nlp_controller(request, with_template=False)
    info = nlp_controller.get_collection_info()
    return JSONResponse(
        content={
            "signal": ResponseSignal.VECTORDB_COLLECTION_RETRIEVED.value,
            "collection_info": info,
        }
    )


@nlp_router.post("/index/backfill-languages",
                 dependencies=[Depends(require_roles("admin"))])
async def backfill_chunk_languages(request: Request, overwrite: bool = False):
    nlp_controller = _build_nlp_controller(request, with_template=False)
    chunk_model = await ChunkModel.create_instance(db_client=request.app.db_client)

    qdrant_stats = nlp_controller.backfill_chunk_languages(overwrite=overwrite)
    mongo_stats = await chunk_model.backfill_languages(overwrite=overwrite)

    return JSONResponse(
        content={
            "signal": ResponseSignal.LANGUAGE_BACKFILL_DONE.value,
            "qdrant": qdrant_stats,
            "mongo": mongo_stats,
        }
    )


@nlp_router.post("/search", dependencies=[Depends(require_roles("admin"))])
async def search_corpus(request: Request, search_request: SearchRequest):
    nlp_controller = _build_nlp_controller(request, with_template=False)
    results = nlp_controller.search_corpus(
        text=search_request.text,
        limit=search_request.limit,
        language=search_request.language,
    )
    if not results:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": ResponseSignal.VECTORDB_SEARCH_ERROR.value},
        )
    return JSONResponse(
        content={
            "signal": ResponseSignal.VECTORDB_SEARCH_SUCCESS.value,
            "results": [r.dict() for r in results],
        }
    )


@nlp_router.get("/discussions")
async def list_discussions(request: Request,
                           user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    message_model = await MessageModel.create_instance(db_client=request.app.db_client)

    discussions = await discussion_model.list_discussions(user_id=user.user_id)

    items = []
    for d in discussions:
        first = await message_model.get_first_user_message(discussion_id=d.discussion_id)
        if first is None:
            title = "New discussion"
        else:
            text = first.content.strip()
            title = (text[:60] + "…") if len(text) > 60 else text
        items.append({
            "discussion_id": d.discussion_id,
            "title": title,
            "updated_at": d.updated_at.isoformat(),
        })

    return JSONResponse(content={
        "signal": ResponseSignal.DISCUSSIONS_LISTED.value,
        "discussions": items,
    })


@nlp_router.post("/discussion")
async def create_discussion(request: Request,
                            user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    discussion = await discussion_model.create_discussion(user_id=user.user_id)
    return JSONResponse(
        content={
            "signal": ResponseSignal.DISCUSSION_CREATED.value,
            "discussion_id": discussion.discussion_id,
        }
    )


@nlp_router.post("/discussion/{discussion_id}/ask")
async def ask_in_discussion(request: Request, discussion_id: str,
                            ask_request: AskRequest,
                            user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    message_model = await MessageModel.create_instance(db_client=request.app.db_client)

    discussion = await discussion_model.get_discussion(
        discussion_id=discussion_id, user_id=user.user_id
    )
    if discussion is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": ResponseSignal.DISCUSSION_NOT_FOUND.value},
        )

    prior = await message_model.get_history(
        discussion_id=discussion_id, limit=HISTORY_TURNS_FOR_CONTEXT
    )

    nlp_controller = _build_nlp_controller(request, with_template=True)
    answer, sources = nlp_controller.answer_rag_question(
        query=ask_request.text,
        prior_messages=prior,
        limit=ask_request.limit,
        language=ask_request.language,
    )

    if not answer:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": ResponseSignal.RAG_ANSWER_ERROR.value},
        )

    await message_model.append_message(Message(
        discussion_id=discussion_id,
        role="user",
        content=ask_request.text,
    ))
    await message_model.append_message(Message(
        discussion_id=discussion_id,
        role="assistant",
        content=answer,
        sources=sources,
    ))
    await discussion_model.touch(discussion_id=discussion_id, user_id=user.user_id)

    return JSONResponse(
        content={
            "signal": ResponseSignal.RAG_ANSWER_SUCCESS.value,
            "discussion_id": discussion_id,
            "answer": answer,
            "sources": [s.dict() for s in sources],
        }
    )


@nlp_router.post("/discussion/{discussion_id}/ask/stream")
async def ask_in_discussion_stream(request: Request, discussion_id: str,
                                   ask_request: AskRequest,
                                   user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    message_model = await MessageModel.create_instance(db_client=request.app.db_client)

    discussion = await discussion_model.get_discussion(
        discussion_id=discussion_id, user_id=user.user_id
    )
    if discussion is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": ResponseSignal.DISCUSSION_NOT_FOUND.value},
        )

    prior = await message_model.get_history(
        discussion_id=discussion_id, limit=HISTORY_TURNS_FOR_CONTEXT
    )

    nlp_controller = _build_nlp_controller(request, with_template=True)

    def sse(event: str, data) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue = asyncio.Queue()
        SENTINEL = object()

        def producer():
            try:
                for kind, payload in nlp_controller.answer_rag_question_stream(
                    query=ask_request.text,
                    prior_messages=prior,
                    limit=ask_request.limit,
                    language=ask_request.language,
                ):
                    loop.call_soon_threadsafe(queue.put_nowait, (kind, payload))
            except Exception as exc:
                logger.exception("Streaming RAG failed")
                loop.call_soon_threadsafe(
                    queue.put_nowait, ("error", f"exception: {exc}")
                )
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)

        worker = loop.run_in_executor(None, producer)

        final_answer = None
        final_sources = []
        try:
            while True:
                item = await queue.get()
                if item is SENTINEL:
                    break
                kind, payload = item
                if kind == "sources":
                    final_sources = payload
                    yield sse(
                        "sources",
                        {"sources": [s.dict() for s in payload]},
                    )
                elif kind == "token":
                    yield sse("token", {"text": payload})
                elif kind == "done":
                    final_answer = payload
                    yield sse(
                        "done",
                        {"signal": ResponseSignal.RAG_ANSWER_SUCCESS.value},
                    )
                elif kind == "error":
                    yield sse(
                        "error",
                        {"signal": ResponseSignal.RAG_ANSWER_ERROR.value,
                         "detail": payload},
                    )
        finally:
            await worker

        if final_answer:
            await message_model.append_message(Message(
                discussion_id=discussion_id,
                role="user",
                content=ask_request.text,
            ))
            await message_model.append_message(Message(
                discussion_id=discussion_id,
                role="assistant",
                content=final_answer,
                sources=final_sources,
            ))
            await discussion_model.touch(
                discussion_id=discussion_id, user_id=user.user_id
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@nlp_router.get("/discussion/{discussion_id}/history")
async def get_discussion_history(request: Request, discussion_id: str,
                                 user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    message_model = await MessageModel.create_instance(db_client=request.app.db_client)

    discussion = await discussion_model.get_discussion(
        discussion_id=discussion_id, user_id=user.user_id
    )
    if discussion is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": ResponseSignal.DISCUSSION_NOT_FOUND.value},
        )

    history = await message_model.get_history(discussion_id=discussion_id)
    return JSONResponse(
        content={
            "signal": ResponseSignal.DISCUSSION_HISTORY_RETRIEVED.value,
            "discussion_id": discussion_id,
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "sources": [s.dict() for s in m.sources],
                    "created_at": m.created_at.isoformat(),
                }
                for m in history
            ],
        }
    )


@nlp_router.delete("/discussion/{discussion_id}")
async def delete_discussion(request: Request, discussion_id: str,
                            user: CurrentUser = Depends(get_current_user)):
    discussion_model = await DiscussionModel.create_instance(db_client=request.app.db_client)
    message_model = await MessageModel.create_instance(db_client=request.app.db_client)

    deleted = await discussion_model.delete_discussion(
        discussion_id=discussion_id, user_id=user.user_id
    )
    if deleted == 0:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": ResponseSignal.DISCUSSION_NOT_FOUND.value},
        )

    await message_model.delete_by_discussion(discussion_id=discussion_id)

    return JSONResponse(
        content={
            "signal": ResponseSignal.DISCUSSION_DELETED.value,
            "discussion_id": discussion_id,
        }
    )
