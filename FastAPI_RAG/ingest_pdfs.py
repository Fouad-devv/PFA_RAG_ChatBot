"""
Run this script once to ingest your PDFs into MongoDB Atlas.
Place your PDF files in the data/ folder then run:
    python ingest_pdfs.py
"""

import os
import glob
import pdfplumber
from dotenv import load_dotenv
from embedder import embed_batch
from retriever import insert_chunks

load_dotenv()

CHUNK_SIZE = 500      # characters per chunk
CHUNK_OVERLAP = 100   # overlap between chunks to keep context


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
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def ingest_pdf(pdf_path: str):
    filename = os.path.basename(pdf_path)
    print(f"\n📄 Processing: {filename}")

    # 1. Extract text
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print(f"   No text found in {filename}, skipping.")
        return

    print(f"   Extracted {len(text)} characters")

    # 2. Split into chunks
    chunks = chunk_text(text)
    print(f"  Split into {len(chunks)} chunks")

    # 3. Embed all chunks locally (no OpenAI)
    print(f"   Embedding chunks (this may take a moment)...")
    vectors = embed_batch(chunks)
    print(f"   Embeddings generated ({len(vectors[0])} dimensions each)")

    # 4. Store in MongoDB Atlas
    inserted = insert_chunks(chunks, vectors, source=filename)
    print(f"   Inserted {inserted} chunks into MongoDB Atlas")


if __name__ == "__main__":
    pdf_files = glob.glob("data/*.pdf")

    if not pdf_files:
        print(" No PDF files found in the data/ folder.")
        print("   → Put your PDF files in FastAPI_RAG/data/ and run again.")
        exit(1)

    print(f" Found {len(pdf_files)} PDF(s) to ingest: {[os.path.basename(f) for f in pdf_files]}")

    for pdf_path in pdf_files:
        ingest_pdf(pdf_path)

    print("\n Ingestion complete! Your data is now in MongoDB Atlas.")
    print("   → Start the FastAPI server: uvicorn main:app --reload --port 8000")
