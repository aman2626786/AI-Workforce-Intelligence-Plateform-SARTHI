from datetime import datetime
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup
from backend.app.services.resource_ingestion.base_adapter import BaseResourceAdapter
from backend.app.services.metadata_extractor import metadata_extractor

class RSSAdapter(BaseResourceAdapter):
    def __init__(self, source_name: str = "Tech Blog", feed_url: str = ""):
        self.source_name = source_name
        self.feed_url = feed_url

    def get_source_name(self) -> str:
        return self.source_name

    async def fetch_latest(self, topic: str = "tech", limit: int = 5) -> List[Dict[str, Any]]:
        if not self.feed_url:
            return []

        results = []
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(self.feed_url)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "xml")
                    items = soup.find_all("item")
                    for item in items[:limit]:
                        title = item.find("title").text.strip() if item.find("title") else "Tech Update"
                        link = item.find("link").text.strip() if item.find("link") else ""
                        desc = item.find("description").text.strip() if item.find("description") else ""
                        # Strip HTML from description
                        clean_desc = BeautifulSoup(desc, "html.parser").get_text()[:280]

                        detected_skills = metadata_extractor.detect_skills_in_text(f"{title} {clean_desc}")

                        results.append({
                            "title": title,
                            "resource_type": "TECH_UPDATE",
                            "short_description": clean_desc,
                            "original_url": link,
                            "source_name": self.source_name,
                            "category": "Technology",
                            "skills": detected_skills,
                            "tags": ["TechUpdate"] + detected_skills[:3],
                            "verification_status": "NEEDS_REVIEW",
                            "status": "NEEDS_REVIEW",
                        })
        except Exception as e:
            print(f"[RSSAdapter] Note: {e}")

        return results
