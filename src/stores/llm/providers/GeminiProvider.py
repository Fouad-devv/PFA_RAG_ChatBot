import logging
import random
import time
from typing import List, Optional
import google.generativeai as genai
from ..LLMInterface import LLMInterface
from ..LLMEnums import GeminiEnums, DocumentTypeEnum


class GeminiProvider(LLMInterface):
    # text-embedding-004 is still a current Gemini model (768-dim, free tier
    # ~1500 RPM), so we no longer silently remap it onto gemini-embedding-001
    # (3072-dim, 100/day free tier) — that map was the source of dimension
    # mismatches and quota burn-through.
    LEGACY_EMBEDDING_MODEL_MAP: dict = {}

    def __init__(self, api_key: str,
                 default_input_max_characters: int = 1000,
                 default_generation_max_output_tokens: int = 1000,
                 default_generation_temperature: float = 0.1):
        self.api_key = api_key

        # Kept for interface symmetry; not applied to RAG prompts so the LLM
        # always sees the full retrieved context (essential for legal citations).
        self.default_input_max_characters = default_input_max_characters
        self.default_generation_max_output_tokens = default_generation_max_output_tokens
        self.default_generation_temperature = default_generation_temperature

        self.generation_model_id: Optional[str] = None
        self.embedding_model_id: Optional[str] = None
        self.embedding_size: Optional[int] = None

        genai.configure(api_key=self.api_key)

        self.enums = GeminiEnums
        self.logger = logging.getLogger(__name__)

    @staticmethod
    def _normalize_model_name(model_id: Optional[str]) -> Optional[str]:
        if model_id is None:
            return None
        clean = model_id.strip()
        if not clean:
            return None
        if clean.startswith("models/") or clean.startswith("tunedModels/"):
            return clean
        return f"models/{clean}"

    def set_generation_model(self, model_id: str):
        self.generation_model_id = self._normalize_model_name(model_id)

    def set_embedding_model(self, model_id: str, embedding_size: int):
        raw_model = (model_id or "").strip()
        legacy_target = self.LEGACY_EMBEDDING_MODEL_MAP.get(raw_model)
        if legacy_target is None and raw_model.startswith("models/"):
            trimmed = raw_model[len("models/") :]
            legacy_target = self.LEGACY_EMBEDDING_MODEL_MAP.get(trimmed)

        if legacy_target is not None:
            self.logger.warning(
                "Embedding model '%s' is a legacy/unsupported Gemini API name; using '%s' instead.",
                model_id,
                legacy_target,
            )
            model_id = legacy_target

        self.embedding_model_id = self._normalize_model_name(model_id)
        self.embedding_size = embedding_size

    def construct_prompt(self, prompt: str, role: str):
        return {"role": role, "content": prompt}

    def _split_history(self, chat_history: List[dict]):
        """Pull out SYSTEM messages (Gemini takes those via system_instruction)
        and convert the rest to Gemini's [{role, parts:[{text}]}] format."""
        system_parts: List[str] = []
        contents: List[dict] = []

        for msg in chat_history:
            role = msg.get("role")
            content = msg.get("content", "")
            if not content:
                continue

            if role == GeminiEnums.SYSTEM.value:
                system_parts.append(content)
                continue

            gemini_role = (
                GeminiEnums.USER.value
                if role == GeminiEnums.USER.value
                else GeminiEnums.ASSISTANT.value
            )
            contents.append({"role": gemini_role, "parts": [{"text": content}]})

        system_instruction = "\n\n".join(system_parts) if system_parts else None
        return system_instruction, contents

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None,
                      temperature: float = None):
        if not self.generation_model_id:
            self.logger.error("Generation model for Gemini was not set")
            return None

        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature

        system_instruction, contents = self._split_history(chat_history)
        contents.append({
            "role": GeminiEnums.USER.value,
            "parts": [{"text": prompt}],
        })

        try:
            model = genai.GenerativeModel(
                model_name=self.generation_model_id,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                contents=contents,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_output_tokens,
                    temperature=temperature,
                ),
            )
        except Exception as e:
            self.logger.error(f"Error while generating text with Gemini: {e}")
            return None

        text = getattr(response, "text", None)
        if not text:
            self.logger.error("Empty response from Gemini")
            return None
        return text

    def generate_text_stream(self, prompt: str, chat_history: list = [],
                             max_output_tokens: int = None,
                             temperature: float = None):
        if not self.generation_model_id:
            self.logger.error("Generation model for Gemini was not set")
            return

        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature

        system_instruction, contents = self._split_history(chat_history)
        contents.append({
            "role": GeminiEnums.USER.value,
            "parts": [{"text": prompt}],
        })

        try:
            model = genai.GenerativeModel(
                model_name=self.generation_model_id,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                contents=contents,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_output_tokens,
                    temperature=temperature,
                ),
                stream=True,
            )
            for chunk in response:
                piece = getattr(chunk, "text", None)
                if piece:
                    yield piece
        except Exception as e:
            self.logger.error(f"Error while streaming text with Gemini: {e}")
            return

    # Minimum seconds between embed_content calls. Gemini free tier is
    # 100 RPM for gemini-embedding-001 — 0.7s leaves headroom (~85 RPM).
    # Overridable via env GEMINI_EMBED_MIN_INTERVAL_SEC.
    _last_embed_call_ts: float = 0.0

    @classmethod
    def _embed_throttle(cls):
        import os
        try:
            min_interval = float(os.environ.get("GEMINI_EMBED_MIN_INTERVAL_SEC", "0.7"))
        except ValueError:
            min_interval = 0.7
        if min_interval <= 0:
            return
        elapsed = time.monotonic() - cls._last_embed_call_ts
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)
        cls._last_embed_call_ts = time.monotonic()

    def embed_text(self, text: str, document_type: str = None):
        if not self.embedding_model_id:
            self.logger.error("Embedding model for Gemini was not set")
            return None

        task_type = GeminiEnums.DOCUMENT.value
        if document_type == DocumentTypeEnum.QUERY.value:
            task_type = GeminiEnums.QUERY.value

        embed_kwargs = {
            "model": self.embedding_model_id,
            "content": text,
            "task_type": task_type,
        }
        if self.embedding_size is not None:
            embed_kwargs["output_dimensionality"] = self.embedding_size

        # Retry on 429 (rate limit) with exponential backoff. Other errors
        # fail fast — we deliberately do NOT fall back to a dimensionless
        # call, because that returns the model's native size and corrupts
        # the Qdrant batch with the wrong shape.
        max_attempts = 5
        result = None
        for attempt in range(max_attempts):
            try:
                self._embed_throttle()
                result = genai.embed_content(**embed_kwargs)
                break
            except Exception as e:
                msg = str(e)
                msg_lower = msg.lower()
                is_rate_limit = "429" in msg or "quota" in msg_lower or "rate" in msg_lower
                # Daily quotas don't recover with backoff — abort the whole
                # batch instead of burning more requests on doomed retries.
                is_daily_quota = (
                    "perday" in msg_lower.replace(" ", "")
                    or "requestsperday" in msg_lower.replace(" ", "")
                    or "per day" in msg_lower
                )
                if is_daily_quota:
                    self.logger.error(
                        "Gemini daily quota exhausted — aborting embed retries: %s", e
                    )
                    return None
                if is_rate_limit and attempt < max_attempts - 1:
                    delay = min(60.0, (2 ** attempt) + random.uniform(0, 1))
                    self.logger.warning(
                        "Gemini embed rate-limited (attempt %d/%d), sleeping %.1fs",
                        attempt + 1, max_attempts, delay,
                    )
                    time.sleep(delay)
                    continue
                self.logger.error(f"Error while embedding text with Gemini: {e}")
                return None

        embedding = result.get("embedding") if isinstance(result, dict) else None
        if not embedding:
            self.logger.error("Empty embedding from Gemini")
            return None

        # Defensive: if the model ignored output_dimensionality, the vector
        # won't fit the Qdrant collection. Drop it rather than poison the batch.
        if self.embedding_size is not None and len(embedding) != self.embedding_size:
            self.logger.error(
                "Embedding dimension mismatch: got %d, expected %d (model=%s). "
                "Check EMBEDDING_MODEL_ID vs EMBEDDING_MODEL_SIZE.",
                len(embedding), self.embedding_size, self.embedding_model_id,
            )
            return None

        return embedding
