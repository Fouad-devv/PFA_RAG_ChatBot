import glob
import io
import logging
import os

import pdfplumber

from .BaseController import BaseController

COLLECTION_NAME = "documents"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


class AdminController(BaseController):

    def __init__(self, vectordb_client, embedding_client=None):
        super().__init__()
        self.vectordb_client = vectordb_client
        self.embedding_client = embedding_client
        self.collection_name = COLLECTION_NAME
        self.logger = logging.getLogger(__name__)

    def get_stats(self) -> dict:
        total_chunks = self.vectordb_client.count_chunks(self.collection_name)
        docs = self.vectordb_client.list_documents_grouped(self.collection_name)
        return {"total_documents": len(docs), "total_chunks": total_chunks}

    def list_documents(self) -> list:
        return self.vectordb_client.list_documents_grouped(self.collection_name)

    def delete_document(self, source: str) -> int:
        count = self.vectordb_client.delete_by_source(self.collection_name, source)
        self.logger.info("Deleted %d chunks for source: %s", count, source)
        return count

    def list_chunks(self, search: str = None, page: int = 1, limit: int = 20) -> dict:
        skip = (page - 1) * limit
        return self.vectordb_client.list_chunks(
            self.collection_name, search=search, skip=skip, limit=limit
        )

    def delete_chunk(self, chunk_id: str) -> bool:
        return self.vectordb_client.delete_chunk_by_id(self.collection_name, chunk_id)

    # ── Ingestion helpers ────────────────────────────────────────────────────

    def _extract_text(self, pdf_bytes: bytes) -> str:
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    def _chunk_text(self, text: str) -> list:
        chunks, start = [], 0
        while start < len(text):
            chunk = text[start : start + CHUNK_SIZE].strip()
            if chunk:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    def upload_and_ingest(self, filename: str, pdf_bytes: bytes, nlp_controller) -> dict:
        text = self._extract_text(pdf_bytes)
        if not text:
            return {"error": "No extractable text found in PDF", "filename": filename}

        chunks = self._chunk_text(text)
        metadata_list = [{"source": filename} for _ in chunks]
        nlp_controller.index_into_vector_db(texts=chunks, metadata_list=metadata_list)
        self.logger.info("Ingested %d chunks from upload: %s", len(chunks), filename)
        return {"filename": filename, "chunks": len(chunks)}

    def reingest_all(self, nlp_controller) -> dict:
        pdf_files = glob.glob("data/*.pdf")
        if not pdf_files:
            return {"error": "No PDF files found in the data/ folder"}

        results, first = [], True
        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

            text = self._extract_text(pdf_bytes)
            if not text:
                results.append({"filename": filename, "chunks": 0, "skipped": True})
                continue

            chunks = self._chunk_text(text)
            metadata_list = [{"source": filename} for _ in chunks]
            nlp_controller.index_into_vector_db(
                texts=chunks, metadata_list=metadata_list, do_reset=first
            )
            first = False
            results.append({"filename": filename, "chunks": len(chunks)})
            self.logger.info("Re-ingested %d chunks from %s", len(chunks), filename)

        return {
            "reingested": len([r for r in results if not r.get("skipped")]),
            "total_chunks": sum(r["chunks"] for r in results),
            "documents": results,
        }
