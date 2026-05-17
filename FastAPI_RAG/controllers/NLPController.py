import re
import logging
from typing import List, Optional
from .BaseController import BaseController
from models.db_schemes import RetrievedDocument
from stores.llm.LLMEnums import DocumentTypeEnum

logger = logging.getLogger("uvicorn.error")

COLLECTION_NAME = "documents"

SYSTEM_PROMPT = (
    "Tu es un assistant expert en droit du travail marocain. "
    "IMPORTANT : réponds toujours dans la même langue que la question posée par l'utilisateur. "
    "Si la question est en arabe, réponds en arabe. Si elle est en français, réponds en français. "
    "Réponds UNIQUEMENT en te basant sur les extraits du Code du Travail marocain fournis ci-dessous. "
    "Si la réponse ne se trouve pas dans ces extraits, réponds dans la langue de la question : "
    "en arabe : 'لم أجد معلومات حول هذا الموضوع في وثائق مدونة الشغل المغربية.' "
    "en français : 'Je ne trouve pas d'information sur ce sujet dans les documents du Code du Travail marocain.' "
    "N'utilise jamais tes connaissances générales. Cite les articles quand ils apparaissent.\n"
    "Formate ta réponse en Markdown : utilise **gras** pour les termes importants et les références "
    "d'articles, des listes à puces ou numérotées pour les énumérations, et des sauts de ligne "
    "clairs entre les sections."
)

_AR_GREETINGS = {
    "مرحبا", "مرحباً", "السلام عليكم", "أهلا", "أهلاً", "هلا",
    "صباح الخير", "مساء الخير", "سلام", "أهلين", "هلو",
}
_FR_GREETINGS = {
    "bonjour", "bonsoir", "salut", "coucou", "allô", "allo",
    "bonne journée", "bonne soirée", "hello", "bjr", "bsr",
}
_EN_GREETINGS = {
    "hello", "hi", "hey", "howdy", "greetings",
    "good morning", "good afternoon", "good evening", "good day",
}

GREETING_RESPONSES = {
    "ar": (
        "مرحباً! أنا مساعد خبير في قانون العمل المغربي. "
        "أنا مستعد للإجابة على أسئلتكم استناداً إلى مقتطفات مدونة الشغل المغربية.\n\n"
        "لا تترددوا في طرح أسئلتكم، وسأبذل قصارى جهدي لتزويدكم بإجابات واضحة ودقيقة، "
        "مع الإشارة إلى المواد ذات الصلة عند الاقتضاء.\n\n"
        "ما هو سؤالكم؟"
    ),
    "fr": (
        "Bonjour ! Je suis un assistant expert en droit du travail marocain. "
        "Je suis prêt à répondre à vos questions en me basant sur les extraits "
        "du Code du Travail marocain fournis.\n\n"
        "N'hésitez pas à me poser vos questions, et je ferai de mon mieux pour vous fournir "
        "des réponses claires et précises, en citant les articles pertinents lorsque nécessaire.\n\n"
        "Quelle est votre question ?"
    ),
    "en": (
        "Hello! I am an expert assistant in Moroccan labor law. "
        "I am ready to answer your questions based on the excerpts from the Moroccan Labor Code.\n\n"
        "Feel free to ask your questions, and I will do my best to provide clear and precise answers, "
        "citing relevant articles when necessary.\n\n"
        "What is your question?"
    ),
}


def _detect_greeting(text: str) -> Optional[str]:
    """Return language code if text is a greeting, else None."""
    cleaned = text.strip().lower()

    # Ignore long messages — definitely not just a greeting
    if len(cleaned.split()) > 6:
        return None

    # Arabic: presence of Arabic characters
    if re.search(r"[؀-ۿ]", text):
        if any(g in text for g in _AR_GREETINGS):
            return "ar"
        return None

    # French greetings (check before English — "hello" is shared)
    if any(cleaned == g or cleaned.startswith(g) for g in _FR_GREETINGS):
        return "fr"

    # English greetings
    if any(cleaned == g or cleaned.startswith(g) for g in _EN_GREETINGS):
        return "en"

    return None


class NLPController(BaseController):

    def __init__(self, vectordb_client, generation_client, embedding_client):
        super().__init__()
        self.vectordb_client = vectordb_client
        self.generation_client = generation_client
        self.embedding_client = embedding_client
        self.collection_name = COLLECTION_NAME

    # ── Indexing ───────────────────────────────────────────────────────────────

    def index_into_vector_db(self, texts: List[str], metadata_list: List[dict],
                             do_reset: bool = False) -> bool:
        self.vectordb_client.create_collection(
            collection_name=self.collection_name,
            embedding_size=self.embedding_client.embedding_size,
            do_reset=do_reset,
        )

        kept_texts, kept_metadata, kept_vectors = [], [], []
        skipped = 0

        for text, metadata in zip(texts, metadata_list):
            text = (text or "").strip()
            if not text:
                skipped += 1
                continue
            vector = self.embedding_client.embed_text(
                text=text, document_type=DocumentTypeEnum.DOCUMENT.value
            )
            if not vector:
                skipped += 1
                continue
            kept_texts.append(text)
            kept_metadata.append(metadata)
            kept_vectors.append(vector)

        if skipped:
            logger.warning("Skipped %d/%d chunks during indexing", skipped, len(texts))

        if not kept_texts:
            return True

        self.vectordb_client.insert_many(
            collection_name=self.collection_name,
            texts=kept_texts,
            metadata=kept_metadata,
            vectors=kept_vectors,
        )
        return True

    # ── Search ─────────────────────────────────────────────────────────────────

    def search_corpus(self, text: str, limit: int = 10,
                      min_score: float = 0.25) -> Optional[List[RetrievedDocument]]:
        vector = self.embedding_client.embed_text(
            text=text, document_type=DocumentTypeEnum.QUERY.value
        )
        if not vector:
            return None
        return self.vectordb_client.search_by_vector(
            collection_name=self.collection_name,
            vector=vector,
            limit=limit,
            min_score=min_score,
        )

    # ── RAG ───────────────────────────────────────────────────────────────────

    def _build_context(self, retrieved: List[RetrievedDocument]) -> str:
        return "\n\n".join(
            f"[Document {i + 1}]\n{doc.text}"
            for i, doc in enumerate(retrieved)
        )

    def _build_chat_history(self) -> list:
        return [
            self.generation_client.construct_prompt(
                prompt=SYSTEM_PROMPT,
                role=self.generation_client.enums.SYSTEM.value,
            )
        ]

    def answer_rag_question(self, query: str, limit: int = 10) -> tuple:
        lang = _detect_greeting(query)
        if lang:
            return GREETING_RESPONSES[lang], []

        retrieved = self.search_corpus(text=query, limit=limit)
        if not retrieved:
            return None, []

        context = self._build_context(retrieved)
        full_prompt = (
            f"--- Extraits du document ---\n{context}\n--- Fin des extraits ---\n\n{query}"
        )
        answer = self.generation_client.generate_text(
            prompt=full_prompt,
            chat_history=self._build_chat_history(),
        )
        return answer, retrieved

    def answer_rag_question_stream(self, query: str, limit: int = 10):
        lang = _detect_greeting(query)
        if lang:
            yield ("greeting", GREETING_RESPONSES[lang])
            return

        retrieved = self.search_corpus(text=query, limit=limit)
        if not retrieved:
            yield ("error", "no_results")
            return

        yield ("sources", retrieved)

        context = self._build_context(retrieved)
        full_prompt = (
            f"--- Extraits du document ---\n{context}\n--- Fin des extraits ---\n\n{query}"
        )

        collected = []
        for piece in self.generation_client.generate_text_stream(
            prompt=full_prompt,
            chat_history=self._build_chat_history(),
        ):
            collected.append(piece)
            yield ("token", piece)

        answer = "".join(collected)
        if not answer:
            yield ("error", "empty_answer")
            return
        yield ("done", answer)
