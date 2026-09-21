import urllib.parse
from datetime import datetime
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup
from backend.app.services.resource_ingestion.base_adapter import BaseResourceAdapter
from backend.app.services.metadata_extractor import metadata_extractor

class ArxivAdapter(BaseResourceAdapter):
    def get_source_name(self) -> str:
        return "arXiv"

    async def fetch_latest(self, topic: str = "cs.AI", limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fetches latest academic preprints from arXiv public API.
        Does NOT download or re-host PDF; only links to official arXiv abstract landing page.
        """
        query = f"cat:{topic}"
        url = f"https://export.arxiv.org/api/query?search_query={urllib.parse.quote(query)}&sortBy=submittedDate&sortOrder=descending&max_results={limit}"

        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "xml")
                    entries = soup.find_all("entry")
                    for e in entries:
                        title = e.find("title").text.strip().replace("\n", " ")
                        summary = e.find("summary").text.strip().replace("\n", " ")
                        abs_url = e.find("id").text.strip()
                        published_str = e.find("published").text.strip() if e.find("published") else None
                        published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00")) if published_str else None

                        authors = [a.find("name").text.strip() for a in e.find_all("author")]
                        author_str = ", ".join(authors[:3]) + (" et al." if len(authors) > 3 else "")

                        detected_skills = metadata_extractor.detect_skills_in_text(f"{title} {summary}")

                        results.append({
                            "title": title,
                            "resource_type": "RESEARCH_PAPER",
                            "short_description": (summary[:280] + "...") if len(summary) > 280 else summary,
                            "content_summary": summary,
                            "original_url": abs_url,
                            "source_name": "arXiv",
                            "source_domain": "arxiv.org",
                            "author": author_str,
                            "publisher": "arXiv.org",
                            "published_at": published_at,
                            "language": "en",
                            "difficulty": "Advanced",
                            "category": "Research",
                            "subcategory": "Computer Science / AI",
                            "skills": detected_skills,
                            "tags": ["Research", "arXiv", "Machine Learning"] + detected_skills[:3],
                            "verification_status": "NEEDS_REVIEW",
                            "status": "NEEDS_REVIEW",
                        })
        except Exception as e:
            print(f"[ArxivAdapter] Ingestion note: {e}")

        return results

arxiv_adapter = ArxivAdapter()
