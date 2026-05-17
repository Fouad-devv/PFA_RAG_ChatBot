from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from helpers.config import get_settings
from stores.llm.LLMProviderFactory import LLMProviderFactory
from stores.llm.providers.MultiLLMProvider import MultiLLMProvider
from stores.vectordb.VectorDBProviderFactory import VectorDBProviderFactory
from routes import base, nlp


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    llm_factory = LLMProviderFactory(settings)
    vectordb_factory = VectorDBProviderFactory(settings)

    # build generation provider chain: Groq → Gemini → Cohere
    generation_providers = []

    groq = llm_factory.create("GROQ")
    groq.set_generation_model(settings.GENERATION_MODEL_ID)
    generation_providers.append(groq)

    if settings.GEMINI_API_KEY:
        gemini = llm_factory.create("GEMINI")
        gemini.set_generation_model(settings.GEMINI_MODEL_ID)
        generation_providers.append(gemini)

    if settings.COHERE_API_KEY:
        cohere = llm_factory.create("COHERE")
        cohere.set_generation_model(settings.COHERE_MODEL_ID)
        generation_providers.append(cohere)

    app.generation_client = (
        MultiLLMProvider(generation_providers)
        if len(generation_providers) > 1
        else generation_providers[0]
    )

    # embedding client (local sentence-transformers by default)
    app.embedding_client = llm_factory.create(provider=settings.EMBEDDING_BACKEND)
    app.embedding_client.set_embedding_model(
        model_id=settings.EMBEDDING_MODEL_ID,
        embedding_size=settings.EMBEDDING_MODEL_SIZE,
    )

    # vector db client (MongoDB Atlas)
    app.vectordb_client = vectordb_factory.create(provider=settings.VECTOR_DB_BACKEND)
    app.vectordb_client.connect()

    yield

    app.vectordb_client.disconnect()


app = FastAPI(title="RAG Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base.base_router)
app.include_router(nlp.nlp_router)
