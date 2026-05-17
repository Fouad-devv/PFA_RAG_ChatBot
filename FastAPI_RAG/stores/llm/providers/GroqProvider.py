import logging
from groq import Groq
from ..LLMInterface import LLMInterface
from ..LLMEnums import GroqEnums

FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]


class GroqProvider(LLMInterface):

    def __init__(self, api_key: str,
                 default_input_max_characters: int = 1000,
                 default_generation_max_output_tokens: int = 1024,
                 default_generation_temperature: float = 0.3):
        self.api_key = api_key
        self.default_input_max_characters = default_input_max_characters
        self.default_generation_max_output_tokens = default_generation_max_output_tokens
        self.default_generation_temperature = default_generation_temperature

        self.generation_model_id = None
        self.embedding_model_id = None
        self.embedding_size = None

        self.client = Groq(api_key=api_key)
        self.enums = GroqEnums
        self.logger = logging.getLogger(__name__)

    def set_generation_model(self, model_id: str):
        self.generation_model_id = model_id

    def set_embedding_model(self, model_id: str, embedding_size: int):
        self.logger.error("GroqProvider does not support embeddings")

    def construct_prompt(self, prompt: str, role: str):
        return {"role": role, "content": prompt}

    def _model_list(self):
        main = self.generation_model_id or FALLBACK_MODELS[0]
        return [main] + [m for m in FALLBACK_MODELS if m != main]

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None, temperature: float = None):
        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature
        messages = list(chat_history) + [{"role": "user", "content": prompt}]

        for model in self._model_list():
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_output_tokens,
                    temperature=temperature,
                    timeout=30,
                )
                return response.choices[0].message.content
            except Exception as e:
                self.logger.warning(f"Groq model {model} failed: {e}")

        self.logger.error("All Groq models failed")
        return None

    def generate_text_stream(self, prompt: str, chat_history: list = [],
                             max_output_tokens: int = None, temperature: float = None):
        max_output_tokens = max_output_tokens or self.default_generation_max_output_tokens
        temperature = temperature if temperature is not None else self.default_generation_temperature
        messages = list(chat_history) + [{"role": "user", "content": prompt}]

        for model in self._model_list():
            try:
                stream = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_output_tokens,
                    temperature=temperature,
                    timeout=30,
                    stream=True,
                )
                for chunk in stream:
                    piece = chunk.choices[0].delta.content
                    if piece:
                        yield piece
                return
            except Exception as e:
                self.logger.warning(f"Groq model {model} failed during streaming: {e}")

        self.logger.error("All Groq models failed during streaming")

    def embed_text(self, text: str, document_type: str = None):
        self.logger.error("GroqProvider does not support embeddings")
        return None
