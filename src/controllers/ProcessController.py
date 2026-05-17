import os
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .BaseController import BaseController
from helpers.lang import detect_language
from models import ProcessingEnum


class ProcessController(BaseController):

    def __init__(self):
        super().__init__()
        # files are read from the shared assets/files directory
        self.source_dir = self.files_dir

    def list_source_files(self):
        if not os.path.isdir(self.source_dir):
            return []
        return [
            name for name in os.listdir(self.source_dir)
            if os.path.isfile(os.path.join(self.source_dir, name))
        ]

    def get_file_size(self, file_id: str):
        file_path = os.path.join(self.source_dir, file_id)
        if not os.path.exists(file_path):
            return 0
        return os.path.getsize(file_path)

    def get_file_extension(self, file_id: str):
        return os.path.splitext(file_id)[-1]

    def get_file_loader(self, file_id: str):
        file_ext = self.get_file_extension(file_id=file_id)
        file_path = os.path.join(self.source_dir, file_id)

        if not os.path.exists(file_path):
            return None

        if file_ext == ProcessingEnum.TXT.value:
            return TextLoader(file_path, encoding="utf-8")

        if file_ext == ProcessingEnum.PDF.value:
            return PyMuPDFLoader(file_path)

        return None

    def get_file_content(self, file_id: str):
        loader = self.get_file_loader(file_id=file_id)
        if loader:
            return loader.load()
        return None

    def process_file_content(self, file_content: list, file_id: str,
                             chunk_size: int = 2000, overlap_size: int = 400):
        # Separators tuned for Moroccan legal text in both French and Arabic:
        # prefer paragraph/article breaks first, then sentence punctuation
        # (incl. Arabic ؟ ؛ ،), then whitespace, then characters.
        separators = [
            "\n\n",
            "\nArticle ", "\nArt. ", "\nCHAPITRE ", "\nSECTION ", "\nTITRE ",
            "\nالمادة ", "\nالفصل ", "\nالباب ", "\nالقسم ",
            "\n",
            ". ", "? ", "! ",
            "؟ ", "؛ ", "، ", "۔ ",
            " ",
            "",
        ]

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap_size,
            length_function=len,
            separators=separators,
            keep_separator=True,
        )

        file_content_texts = [rec.page_content for rec in file_content]
        file_content_metadata = [rec.metadata for rec in file_content]

        chunks = text_splitter.create_documents(
            file_content_texts,
            metadatas=file_content_metadata,
        )

        cleaned = []
        for chunk in chunks:
            text = (chunk.page_content or "").strip()
            if not text:
                continue
            chunk.page_content = text
            chunk.metadata = dict(chunk.metadata or {})
            chunk.metadata.setdefault("asset_name", file_id)
            chunk.metadata["language"] = detect_language(text)
            cleaned.append(chunk)

        return cleaned
