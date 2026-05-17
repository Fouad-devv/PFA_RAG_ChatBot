import logging
from ..LLMInterface import LLMInterface


class MultiLLMProvider(LLMInterface):
    """Tries providers in order, falling back to the next on failure."""

    def __init__(self, providers: list):
        self.providers = providers
        self.enums = providers[0].enums if providers else None
        self.embedding_size = None
        self.logger = logging.getLogger(__name__)

    def set_generation_model(self, model_id: str):
        pass  # each provider is already configured individually

    def set_embedding_model(self, model_id: str, embedding_size: int):
        pass  # embedding is handled by a separate client

    def construct_prompt(self, prompt: str, role: str):
        return self.providers[0].construct_prompt(prompt, role)

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None, temperature: float = None):
        for provider in self.providers:
            try:
                result = provider.generate_text(prompt, chat_history, max_output_tokens, temperature)
                if result:
                    return result
            except Exception as e:
                self.logger.warning(f"{provider.__class__.__name__} failed: {e}")
        self.logger.error("All LLM providers failed")
        return None

    def generate_text_stream(self, prompt: str, chat_history: list = [],
                             max_output_tokens: int = None, temperature: float = None):
        for provider in self.providers:
            try:
                gen = provider.generate_text_stream(prompt, chat_history, max_output_tokens, temperature)
                first = next(gen, None)
                if first is None:
                    continue  # provider yielded nothing, try next
                yield first
                for piece in gen:
                    yield piece
                return
            except Exception as e:
                self.logger.warning(f"{provider.__class__.__name__} streaming failed: {e}")
        self.logger.error("All LLM providers failed during streaming")

    def embed_text(self, text: str, document_type: str = None):
        return None
