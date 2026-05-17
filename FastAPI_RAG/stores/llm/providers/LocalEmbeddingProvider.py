import logging
from sentence_transformers import SentenceTransformer
from ..LLMInterface import LLMInterface
from ..LLMEnums import LocalEnums, DocumentTypeEnum


class LocalEmbeddingProvider(LLMInterface):

    def __init__(self, **kwargs):
        self.generation_model_id = None
        self.embedding_model_id = None
        self.embedding_size = None
        self._model = None
        self.enums = LocalEnums
        self.logger = logging.getLogger(__name__)

    def set_generation_model(self, model_id: str):
        self.logger.error("LocalEmbeddingProvider does not support text generation")

    def set_embedding_model(self, model_id: str, embedding_size: int):
        self.embedding_model_id = model_id
        self.embedding_size = embedding_size
        self._model = SentenceTransformer(model_id)

    def generate_text(self, prompt: str, chat_history: list = [],
                      max_output_tokens: int = None, temperature: float = None):
        self.logger.error("LocalEmbeddingProvider does not support text generation")
        return None

    def embed_text(self, text: str, document_type: str = None):
        if not self._model:
            self.logger.error("Embedding model not loaded — call set_embedding_model first")
            return None

        if document_type == DocumentTypeEnum.QUERY.value:
            text = f"query: {text}"
        else:
            text = f"passage: {text}"

        return self._model.encode(text, normalize_embeddings=True).tolist()

    def construct_prompt(self, prompt: str, role: str):
        return {"role": role, "content": prompt}
