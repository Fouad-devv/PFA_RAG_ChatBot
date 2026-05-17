import json
import os
from typing import List, Optional
from .BaseController import BaseController
from helpers.lang import detect_language
from models.db_schemes import DataChunk, RetrievedDocument, Message, MessageSource
from stores.llm.LLMEnums import DocumentTypeEnum


CORPUS_COLLECTION_NAME = "legal_corpus"


class NLPController(BaseController):

    def __init__(self, vectordb_client, generation_client,
                 embedding_client, template_parser=None):
        super().__init__()
        self.vectordb_client = vectordb_client
        self.generation_client = generation_client
        self.embedding_client = embedding_client
        self.template_parser = template_parser
        self.collection_name = CORPUS_COLLECTION_NAME

    def reset_collection(self):
        return self.vectordb_client.delete_collection(collection_name=self.collection_name)

    def get_collection_info(self):
        info = self.vectordb_client.get_collection_info(collection_name=self.collection_name)
        return json.loads(json.dumps(info, default=lambda x: x.__dict__))

    def index_into_vector_db(self, chunks: List[DataChunk],
                             chunks_ids: List, do_reset: bool = False) -> bool:
        self.vectordb_client.create_collection(
            collection_name=self.collection_name,
            embedding_size=self.embedding_client.embedding_size,
            do_reset=do_reset,
        )

        # Embed lazily and drop any chunk whose text is empty or whose
        # embedding call failed — Qdrant rejects None vectors with a
        # pydantic ValidationError, so we must filter before insert.
        kept_texts: List[str] = []
        kept_metadata: List = []
        kept_vectors: List = []
        kept_ids: List = []
        skipped = 0

        for chunk, chunk_id in zip(chunks, chunks_ids):
            text = (chunk.chunk_text or "").strip()
            if not text:
                skipped += 1
                continue

            vector = self.embedding_client.embed_text(
                text=text, document_type=DocumentTypeEnum.DOCUMENT.value
            )
            if not vector:
                skipped += 1
                continue

            kept_texts.append(chunk.chunk_text)
            kept_metadata.append(chunk.chunk_metadata)
            kept_vectors.append(vector)
            kept_ids.append(chunk_id)

        if skipped:
            import logging
            logging.getLogger("uvicorn.error").warning(
                "Skipped %d/%d chunks with empty text or failed embeddings.",
                skipped, len(chunks),
            )

        if not kept_texts:
            return True

        self.vectordb_client.insert_many(
            collection_name=self.collection_name,
            texts=kept_texts,
            metadata=kept_metadata,
            vectors=kept_vectors,
            record_ids=kept_ids,
        )

        return True

    def search_corpus(self, text: str, limit: int = 10,
                      language: Optional[str] = None
                      ) -> Optional[List[RetrievedDocument]]:
        results, _ = self.search_corpus_with_fallback(
            text=text, limit=limit, language=language
        )
        return results

    def search_corpus_with_fallback(
        self, text: str, limit: int = 10, language: Optional[str] = None
    ) -> tuple:
        """Same-language-first retrieval. Returns (results, fallback_used).

        ``fallback_used`` is True when the requested language returned no
        chunks and we widened the search to all languages — the caller
        can use this to allow the LLM to translate.
        """
        vector = self.embedding_client.embed_text(
            text=text, document_type=DocumentTypeEnum.QUERY.value
        )
        if not vector or len(vector) == 0:
            return None, False

        results = self.vectordb_client.search_by_vector(
            collection_name=self.collection_name,
            vector=vector,
            limit=limit,
            filter_language=language,
        )

        fallback_used = False
        if not results and language:
            results = self.vectordb_client.search_by_vector(
                collection_name=self.collection_name,
                vector=vector,
                limit=limit,
            )
            fallback_used = bool(results)

        if not results:
            return None, False
        return results, fallback_used

    def backfill_chunk_languages(self, overwrite: bool = False) -> dict:
        """Scroll the Qdrant collection and tag each chunk's metadata with
        a detected language. Idempotent: skips chunks that already have a
        language set unless ``overwrite`` is True.
        """
        scanned = 0
        updated = 0
        skipped = 0
        by_language = {"ar": 0, "fr": 0}

        for batch in self.vectordb_client.iter_points(
            collection_name=self.collection_name, batch_size=200
        ):
            patch_groups: dict = {}
            for point_id, text, metadata in batch:
                scanned += 1
                if not overwrite and metadata.get("language") in ("ar", "fr"):
                    skipped += 1
                    by_language[metadata["language"]] += 1
                    continue

                lang = detect_language(text)
                by_language[lang] += 1
                patch_groups.setdefault(lang, []).append(point_id)

            for lang, ids in patch_groups.items():
                if self.vectordb_client.update_metadata(
                    collection_name=self.collection_name,
                    point_ids=ids,
                    metadata_patch={"language": lang},
                ):
                    updated += len(ids)

        return {
            "scanned": scanned,
            "updated": updated,
            "skipped_already_tagged": skipped,
            "by_language": by_language,
        }

    def _retrieved_to_sources(self, retrieved: List[RetrievedDocument]) -> List[MessageSource]:
        sources: List[MessageSource] = []
        for doc in retrieved:
            md = doc.metadata or {}
            file_name = md.get("asset_name")
            if not file_name and md.get("source"):
                file_name = os.path.basename(md["source"])
            page = md.get("page")
            sources.append(
                MessageSource(
                    file=file_name,
                    page=page if isinstance(page, int) else None,
                    chunk_text=doc.text,
                    score=doc.score,
                    metadata=md,
                )
            )
        return sources

    def _build_chat_history(self, prior_messages: List[Message]):
        chat_history = []
        if self.template_parser is not None:
            system_prompt = self.template_parser.get("rag", "system_prompt")
            chat_history.append(
                self.generation_client.construct_prompt(
                    prompt=system_prompt,
                    role=self.generation_client.enums.SYSTEM.value,
                )
            )

        role_user = self.generation_client.enums.USER.value
        role_assistant = self.generation_client.enums.ASSISTANT.value
        for msg in prior_messages:
            role = role_user if msg.role == "user" else role_assistant
            chat_history.append(
                self.generation_client.construct_prompt(prompt=msg.content, role=role)
            )
        return chat_history

    def answer_rag_question(self, query: str,
                            prior_messages: Optional[List[Message]] = None,
                            limit: int = 10,
                            language: Optional[str] = None):
        prior_messages = prior_messages or []

        if language and self.template_parser is not None:
            self.template_parser.set_language(language)

        retrieved, fallback_used = self.search_corpus_with_fallback(
            text=query, limit=limit, language=language
        )
        if not retrieved:
            return None, []

        sources = self._retrieved_to_sources(retrieved)

        documents_prompts = "\n".join([
            self.template_parser.get("rag", "document_prompt", {
                "doc_num": idx + 1,
                "chunk_text": doc.text,
            })
            for idx, doc in enumerate(retrieved)
        ])
        footer_prompt = self.template_parser.get("rag", "footer_prompt")

        prompt_parts = [documents_prompts]
        if fallback_used:
            try:
                cross_note = self.template_parser.get("rag", "cross_language_note")
                prompt_parts.append(cross_note)
            except KeyError:
                pass
        prompt_parts.extend([footer_prompt, query])

        chat_history = self._build_chat_history(prior_messages)
        full_prompt = "\n\n".join(prompt_parts)

        answer = self.generation_client.generate_text(
            prompt=full_prompt,
            chat_history=chat_history,
        )

        return answer, sources

    def answer_rag_question_stream(self, query: str,
                                   prior_messages: Optional[List[Message]] = None,
                                   limit: int = 10,
                                   language: Optional[str] = None):
        """Generator that yields ('sources', sources) once, then a series of
        ('token', text_piece), then ('done', full_answer). Yields
        ('error', signal) and stops on failure."""
        prior_messages = prior_messages or []

        if language and self.template_parser is not None:
            self.template_parser.set_language(language)

        retrieved, fallback_used = self.search_corpus_with_fallback(
            text=query, limit=limit, language=language
        )
        if not retrieved:
            yield ("error", "no_results")
            return

        sources = self._retrieved_to_sources(retrieved)
        yield ("sources", sources)

        documents_prompts = "\n".join([
            self.template_parser.get("rag", "document_prompt", {
                "doc_num": idx + 1,
                "chunk_text": doc.text,
            })
            for idx, doc in enumerate(retrieved)
        ])
        footer_prompt = self.template_parser.get("rag", "footer_prompt")

        prompt_parts = [documents_prompts]
        if fallback_used:
            try:
                cross_note = self.template_parser.get("rag", "cross_language_note")
                prompt_parts.append(cross_note)
            except KeyError:
                pass
        prompt_parts.extend([footer_prompt, query])

        chat_history = self._build_chat_history(prior_messages)
        full_prompt = "\n\n".join(prompt_parts)

        collected = []
        for piece in self.generation_client.generate_text_stream(
            prompt=full_prompt,
            chat_history=chat_history,
        ):
            collected.append(piece)
            yield ("token", piece)

        answer = "".join(collected)
        if not answer:
            yield ("error", "empty_answer")
            return
        yield ("done", answer)
