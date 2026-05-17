from .LLMEnums import LLMEnums
from .providers import GroqProvider, CoHereProvider, GeminiProvider, VoyageProvider, LocalEmbeddingProvider


class LLMProviderFactory:

    def __init__(self, config):
        self.config = config

    def create(self, provider: str):
        kwargs = {
            "default_generation_max_output_tokens": self.config.GENERATION_DEFAULT_MAX_TOKENS,
            "default_generation_temperature": self.config.GENERATION_DEFAULT_TEMPERATURE,
        }

        if provider == LLMEnums.GROQ.value:
            return GroqProvider(api_key=self.config.GROQ_API_KEY, **kwargs)

        if provider == LLMEnums.COHERE.value:
            return CoHereProvider(api_key=self.config.COHERE_API_KEY, **kwargs)

        if provider == LLMEnums.GEMINI.value:
            return GeminiProvider(api_key=self.config.GEMINI_API_KEY, **kwargs)

        if provider == LLMEnums.VOYAGE.value:
            return VoyageProvider(api_key=self.config.VOYAGE_API_KEY, **kwargs)

        if provider == LLMEnums.LOCAL.value:
            return LocalEmbeddingProvider()

        return None
