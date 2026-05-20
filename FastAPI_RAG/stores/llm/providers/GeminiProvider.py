import logging
import random
import time
from typing import List, Optional
import google.generativeai as genai
from ..LLMInterface import LLMInterface
from ..LLMEnums import GeminiEnums, DocumentTypeEnum


class GeminiProvider(LLMInterface):

    _last_embed_call_ts: float = 0.0

    def __init__(self, api_key: str,
                 default_input_max_characters: int = 1000,
                 default_generation_max_output_tokens: int = 1024,
                 default_generation_temperature: float = 0.3):
        self.api_key = api_key
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
    def _normalize_model(model_id: Optional[str]) -> Optional[str]:
        if not model_id:
            return None
        clean = model_id.strip()
        if clean.startswith("models/") or clean.startswith("tunedModels/"):
            return clean
        return f"models/{clean}"

    def set_generation_model(self, model_id: str):
        self.generation_model_id = self._normalize_model(model_id)

    def set_embedding_model(self, model_id: str, embedding_size: int):
        self.embedding_model_id = self._normalize_model(model_id)
        self.embedding_size = embedding_size

    def construct_prompt(self, prompt: str, role: str):
        return {"role": role, "content": prompt}

    def _split_history(self, chat_history: List[dict]):
        system_parts, contents = [], []
        for msg in chat_history:
            role = msg.get("role")
            content = msg.get("content", "")
            if not content:
                continue
            if role == GeminiEnums.SYSTEM.value:
                system_parts.append(content)
            else:
                gemini_role = GeminiEnums.USER.value if role == GeminiEnums.USER.value else GeminiEnums.ASSISTANT.value
                contents.append({"role": gemini_role, "parts": [{"text": content}]})
        return "\n\n".join(system_parts) or None, contents

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None, temperature: float = None):
        if not self.generation_model_id:
            self.logger.error("Generation model for Gemini was not set")
            return None

        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature
        system_instruction, contents = self._split_history(chat_history)
        contents.append({"role": GeminiEnums.USER.value, "parts": [{"text": prompt}]})

        try:
            model = genai.GenerativeModel(model_name=self.generation_model_id,
                                          system_instruction=system_instruction)
            response = model.generate_content(
                contents=contents,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_output_tokens, temperature=temperature),
            )
            return getattr(response, "text", None)
        except Exception as e:
            self.logger.error(f"Error generating text with Gemini: {e}")
            return None

    def generate_text_stream(self, prompt: str, chat_history: list = [],
                             max_output_tokens: int = None, temperature: float = None):
        if not self.generation_model_id:
            return
        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature
        system_instruction, contents = self._split_history(chat_history)
        contents.append({"role": GeminiEnums.USER.value, "parts": [{"text": prompt}]})

        try:
            model = genai.GenerativeModel(model_name=self.generation_model_id,
                                          system_instruction=system_instruction)
            response = model.generate_content(
                contents=contents,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_output_tokens, temperature=temperature),
                stream=True,
            )
            line_counts: dict = {}
            buffer = ""
            for chunk in response:
                piece = getattr(chunk, "text", None)
                if not piece:
                    continue
                buffer += piece
                lines = buffer.split("\n")
                repeated = False
                for line in lines:
                    stripped = line.strip()
                    if len(stripped) > 15:
                        line_counts[stripped] = line_counts.get(stripped, 0) + 1
                        if line_counts[stripped] > 2:
                            repeated = True
                            break
                if repeated:
                    self.logger.warning("Gemini repetition loop detected — stopping stream")
                    break
                yield piece
        except Exception as e:
            self.logger.error(f"Error streaming text with Gemini: {e}")

    @classmethod
    def _embed_throttle(cls):
        import os
        try:
            min_interval = float(os.environ.get("GEMINI_EMBED_MIN_INTERVAL_SEC", "0.7"))
        except ValueError:
            min_interval = 0.7
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

        embed_kwargs = {"model": self.embedding_model_id, "content": text, "task_type": task_type}
        if self.embedding_size is not None:
            embed_kwargs["output_dimensionality"] = self.embedding_size

        for attempt in range(5):
            try:
                self._embed_throttle()
                result = genai.embed_content(**embed_kwargs)
                embedding = result.get("embedding") if isinstance(result, dict) else None
                if not embedding:
                    return None
                if self.embedding_size and len(embedding) != self.embedding_size:
                    self.logger.error("Embedding dimension mismatch")
                    return None
                return embedding
            except Exception as e:
                msg = str(e).lower()
                if "per day" in msg or "perday" in msg.replace(" ", ""):
                    self.logger.error("Gemini daily quota exhausted")
                    return None
                if ("429" in str(e) or "rate" in msg) and attempt < 4:
                    time.sleep(min(60.0, (2 ** attempt) + random.uniform(0, 1)))
                    continue
                self.logger.error(f"Error embedding with Gemini: {e}")
                return None
        return None
