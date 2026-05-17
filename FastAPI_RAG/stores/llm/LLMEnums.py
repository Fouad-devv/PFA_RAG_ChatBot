from enum import Enum


class LLMEnums(Enum):
    GROQ = "GROQ"
    COHERE = "COHERE"
    GEMINI = "GEMINI"
    VOYAGE = "VOYAGE"
    LOCAL = "LOCAL"


class GroqEnums(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class CoHereEnums(Enum):
    SYSTEM = "SYSTEM"
    USER = "USER"
    ASSISTANT = "CHATBOT"
    DOCUMENT = "search_document"
    QUERY = "search_query"


class GeminiEnums(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "model"
    DOCUMENT = "RETRIEVAL_DOCUMENT"
    QUERY = "RETRIEVAL_QUERY"


class VoyageEnums(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    DOCUMENT = "document"
    QUERY = "query"


class LocalEnums(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    DOCUMENT = "document"
    QUERY = "query"


class DocumentTypeEnum(Enum):
    DOCUMENT = "document"
    QUERY = "query"
