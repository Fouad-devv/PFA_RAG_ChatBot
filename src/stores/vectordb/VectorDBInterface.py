from abc import ABC, abstractmethod
from typing import Iterator, List, Optional, Tuple
from models.db_schemes import RetrievedDocument

class VectorDBInterface(ABC):

    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def disconnect(self):
        pass

    @abstractmethod
    def is_collection_existed(self, collection_name: str) -> bool:
        pass

    @abstractmethod
    def list_all_collections(self) -> List:
        pass

    @abstractmethod
    def get_collection_info(self, collection_name: str) -> dict:
        pass

    @abstractmethod
    def delete_collection(self, collection_name: str):
        pass

    @abstractmethod
    def create_collection(self, collection_name: str, 
                                embedding_size: int,
                                do_reset: bool = False):
        pass

    @abstractmethod
    def insert_one(self, collection_name: str, text: str, vector: list,
                         metadata: dict = None, 
                         record_id: str = None):
        pass

    @abstractmethod
    def insert_many(self, collection_name: str, texts: list, 
                          vectors: list, metadata: list = None, 
                          record_ids: list = None, batch_size: int = 50):
        pass

    @abstractmethod
    def search_by_vector(self, collection_name: str, vector: list, limit: int,
                         filter_language: Optional[str] = None) -> List[RetrievedDocument]:
        pass

    @abstractmethod
    def iter_points(self, collection_name: str, batch_size: int = 100
                    ) -> Iterator[List[Tuple]]:
        """Yield batches of (point_id, text, metadata) tuples for the whole collection."""
        pass

    @abstractmethod
    def update_metadata(self, collection_name: str, point_ids: list,
                        metadata_patch: dict) -> bool:
        """Merge metadata_patch into the existing metadata payload of each point."""
        pass
