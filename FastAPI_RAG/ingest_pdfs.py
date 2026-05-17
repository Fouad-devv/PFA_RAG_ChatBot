"""
Run this script once to ingest your PDFs into MongoDB Atlas.
Place your PDF files in the data/ folder then run:
    python ingest_pdfs.py
"""

import os
import glob
import pdfplumber
from dotenv import load_dotenv

load_dotenv()

from helpers.config import get_settings
from stores.llm.LLMProviderFactory import LLMProviderFactory
from stores.vectordb.VectorDBProviderFactory import VectorDBProviderFactory
from controllers.NLPController import NLPController

CHUNK_SIZE    = 500
CHUNK_OVERLAP = 100


def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunk = text[start:start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def build_controller() -> NLPController:
    settings = get_settings()
    llm_factory      = LLMProviderFactory(settings)
    vectordb_factory = VectorDBProviderFactory(settings)

    embedding_client = llm_factory.create(provider=settings.EMBEDDING_BACKEND)
    embedding_client.set_embedding_model(
        model_id=settings.EMBEDDING_MODEL_ID,
        embedding_size=settings.EMBEDDING_MODEL_SIZE,
    )

    vectordb_client = vectordb_factory.create(provider=settings.VECTOR_DB_BACKEND)
    vectordb_client.connect()

    # generation_client not needed for ingestion — pass None
    return NLPController(
        vectordb_client=vectordb_client,
        generation_client=None,
        embedding_client=embedding_client,
    )


if __name__ == "__main__":
    pdf_files = glob.glob("data/*.pdf")

    if not pdf_files:
        print("No PDF files found in the data/ folder.")
        print("→ Put your PDF files in FastAPI_RAG/data/ and run again.")
        exit(1)

    print(f"Found {len(pdf_files)} PDF(s): {[os.path.basename(f) for f in pdf_files]}")

    controller = build_controller()
    first_file = True

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        print(f"\nProcessing: {filename}")

        text = extract_text_from_pdf(pdf_path)
        if not text:
            print(f"  No text found, skipping.")
            continue

        chunks = chunk_text(text)
        print(f"  {len(text)} characters → {len(chunks)} chunks")

        metadata_list = [{"source": filename} for _ in chunks]

        # Reset collection only on the first file to clear old embeddings
        controller.index_into_vector_db(
            texts=chunks,
            metadata_list=metadata_list,
            do_reset=first_file,
        )
        first_file = False
        print(f"  Inserted {len(chunks)} chunks")

    print("\nIngestion complete! Run the server: uvicorn main:app --reload")
