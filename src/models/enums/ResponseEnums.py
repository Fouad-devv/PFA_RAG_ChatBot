from enum import Enum


class ResponseSignal(Enum):

    PROCESSING_SUCCESS = "processing_success"
    PROCESSING_FAILED = "processing_failed"
    NO_FILES_ERROR = "not_found_files"
    FILES_LISTED = "files_listed"
    FILES_UPLOADED = "files_uploaded"
    INSERT_INTO_VECTORDB_ERROR = "insert_into_vectordb_error"
    INSERT_INTO_VECTORDB_SUCCESS = "insert_into_vectordb_success"
    VECTORDB_COLLECTION_RETRIEVED = "vectordb_collection_retrieved"
    VECTORDB_SEARCH_ERROR = "vectordb_search_error"
    VECTORDB_SEARCH_SUCCESS = "vectordb_search_success"
    RAG_ANSWER_ERROR = "rag_answer_error"
    RAG_ANSWER_SUCCESS = "rag_answer_success"
    DISCUSSION_CREATED = "discussion_created"
    DISCUSSION_NOT_FOUND = "discussion_not_found"
    DISCUSSION_HISTORY_RETRIEVED = "discussion_history_retrieved"
    DISCUSSIONS_LISTED = "discussions_listed"
    DISCUSSION_DELETED = "discussion_deleted"
    LANGUAGE_BACKFILL_DONE = "language_backfill_done"
