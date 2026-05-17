from .VectorDBEnums import VectorDBEnums
from .providers import MongoDBAtlasProvider


class VectorDBProviderFactory:

    def __init__(self, config):
        self.config = config

    def create(self, provider: str):
        if provider == VectorDBEnums.MONGODB_ATLAS.value:
            return MongoDBAtlasProvider(
                mongo_uri=self.config.MONGO_URI,
                db_name=self.config.MONGO_DB,
                vector_index_name=self.config.MONGO_VECTOR_INDEX,
            )
        return None
