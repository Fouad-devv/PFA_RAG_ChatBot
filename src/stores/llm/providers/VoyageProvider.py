import logging
import os
import random
import time
from typing import Optional

import voyageai

from ..LLMInterface import LLMInterface
from ..LLMEnums import VoyageEnums, DocumentTypeEnum


class VoyageProvider(LLMInterface):
    """Voyage AI is embedding-only. generate_text is intentionally unsupported
    so misconfiguring GENERATION_BACKEND=VOYAGE fails loudly instead of
    silently returning empty answers."""

    _last_embed_call_ts: float = 0.0

    def __init__(self, api_key: str,
                 default_input_max_characters: int = 1000,
                 default_generation_max_output_tokens: int = 1000,
                 default_generation_temperature: float = 0.1):
        self.api_key = api_key
        self.default_input_max_characters = default_input_max_characters
        self.default_generation_max_output_tokens = default_generation_max_output_tokens
        self.default_generation_temperature = default_generation_temperature

        self.generation_model_id: Optional[str] = None
        self.embedding_model_id: Optional[str] = None
        self.embedding_size: Optional[int] = None

        self.client = voyageai.Client(api_key=self.api_key)
        self.enums = VoyageEnums
        self.logger = logging.getLogger(__name__)

    def set_generation_model(self, model_id: str):
        self.generation_model_id = model_id

    def set_embedding_model(self, model_id: str, embedding_size: int):
        self.embedding_model_id = model_id
        self.embedding_size = embedding_size

    def construct_prompt(self, prompt: str, role: str):
        return {"role": role, "content": prompt}

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None, temperature: float = None):
        self.logger.error(
            "Voyage provider does not support text generation — set "
            "GENERATION_BACKEND to OPENAI/COHERE/GEMINI."
        )
        return None

    @classmethod
    def _embed_throttle(cls):
        try:
            min_interval = float(os.environ.get("VOYAGE_EMBED_MIN_INTERVAL_SEC", "0.0"))
        except ValueError:
            min_interval = 0.0
        if min_interval <= 0:
            return
        elapsed = time.monotonic() - cls._last_embed_call_ts
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        cls._last_embed_call_ts = time.monotonic()

    def embed_text(self, text: str, document_type: str = None):
        if not self.client:
            self.logger.error("Voyage client was not set")
            return None
        if not self.embedding_model_id:
            self.logger.error("Embedding model for Voyage was not set")
            return None

        input_type = VoyageEnums.DOCUMENT.value
        if document_type == DocumentTypeEnum.QUERY.value:
            input_type = VoyageEnums.QUERY.value

        # voyage-3-large supports Matryoshka truncation via output_dimension
        # in {256, 512, 1024, 2048}. We only pass it if it's a legal value;
        # otherwise the model returns its native size (1024 for voyage-3*).
        embed_kwargs = {
            "texts": [text],
            "model": self.embedding_model_id,
            "input_type": input_type,
        }
        if self.embedding_size in (256, 512, 1024, 2048):
            embed_kwargs["output_dimension"] = self.embedding_size

        max_attempts = 5
        result = None
        for attempt in range(max_attempts):
            try:
                self._embed_throttle()
                result = self.client.embed(**embed_kwargs)
                break
            except Exception as e:
                msg = str(e)
                msg_lower = msg.lower()
                is_rate_limit = (
                    "429" in msg or "rate limit" in msg_lower or "too many" in msg_lower
                )
                if is_rate_limit and attempt < max_attempts - 1:
                    delay = min(60.0, (2 ** attempt) + random.uniform(0, 1))
                    self.logger.warning(
                        "Voyage embed rate-limited (attempt %d/%d), sleeping %.1fs",
                        attempt + 1, max_attempts, delay,
                    )
                    time.sleep(delay)
                    continue
                self.logger.error(f"Error while embedding text with Voyage: {e}")
                return None

        embeddings = getattr(result, "embeddings", None)
        if not embeddings:
            self.logger.error("Empty embedding from Voyage")
            return None

        embedding = embeddings[0]
        if self.embedding_size is not None and len(embedding) != self.embedding_size:
            self.logger.error(
                "Embedding dimension mismatch: got %d, expected %d (model=%s). "
                "Check EMBEDDING_MODEL_ID vs EMBEDDING_MODEL_SIZE.",
                len(embedding), self.embedding_size, self.embedding_model_id,
            )
            return None

        return embedding
