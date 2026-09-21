from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseResourceAdapter(ABC):
    """
    Abstract Base Class for External Resource Ingestion Adapters.
    Follows:
    External Source -> Source Adapter -> Fetch Metadata -> Normalize -> Deduplicate -> Needs Review
    """

    @abstractmethod
    def get_source_name(self) -> str:
        pass

    @abstractmethod
    async def fetch_latest(self, topic: str = "ai", limit: int = 10) -> List[Dict[str, Any]]:
        pass
