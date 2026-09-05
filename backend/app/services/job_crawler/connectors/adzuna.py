import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import httpx

from backend.app.core.config import settings
from backend.app.services.job_crawler.base_connector import (
    JobSourceConnector,
    RawJobDTO,
    NormalizedJobDTO,
)

logger = logging.getLogger(__name__)

SUPPORTED_ADZUNA_COUNTRIES = {
    "in": "in",
    "us": "us",
    "gb": "gb",
    "uk": "gb",
    "ca": "ca",
    "au": "au",
}

class AdzunaConnector(JobSourceConnector):
    """
    Connector for Adzuna Job Search API.
    Markets supported: India (in), United States (us), United Kingdom (gb), Canada (ca), Australia (au).
    """

    BASE_URL = "https://api.adzuna.com/v1/api/jobs"

    def __init__(
        self,
        app_id: Optional[str] = None,
        app_key: Optional[str] = None,
        rate_limit_rps: float = 3.0,
        max_concurrency: int = 3,
        timeout_seconds: float = 15.0
    ):
        super().__init__(
            source_name="adzuna",
            rate_limit_rps=rate_limit_rps,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            max_retries=3
        )
        self.app_id = app_id or settings.ADZUNA_APP_ID
        self.app_key = app_key or settings.ADZUNA_APP_KEY

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key)

    async def fetch_jobs(
        self,
        role_query: str,
        country: str = "in",
        page: int = 1,
        limit: int = 20
    ) -> List[RawJobDTO]:
        target_country = SUPPORTED_ADZUNA_COUNTRIES.get(country.lower(), "in")

        if not self.is_configured():
            logger.warning("[AdzunaConnector] API credentials not configured. Skipping live fetch.")
            return []

        url = f"{self.BASE_URL}/{target_country}/search/{page}"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": role_query,
            "results_per_page": min(limit, 50),
            "content-type": "application/json",
        }

        async def _make_request():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                return res.json()

        try:
            data = await self.execute_with_retry(_make_request)
            results = data.get("results", [])
            raw_dtos = []
            for item in results:
                job_id = str(item.get("id") or item.get("redirect_url", ""))
                raw_dtos.append(RawJobDTO(
                    source=self.source_name,
                    source_job_id=job_id,
                    raw_payload=item,
                    fetched_at=datetime.utcnow()
                ))
            return raw_dtos
        except Exception as e:
            logger.error(f"[AdzunaConnector] Error fetching jobs for {role_query} in {country}: {e}")
            raise

    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        item = raw_dto.raw_payload

        title = item.get("title", "")
        # Clean Adzuna bold tags like <strong class="highlight">...</strong>
        title = re.sub(r'<[^>]+>', '', title).strip()

        company_dict = item.get("company") or {}
        company_name = company_dict.get("display_name", "").strip() or "Hiring Company"

        location_dict = item.get("location") or {}
        area = location_dict.get("area", [])
        location = ", ".join(area[-2:]) if area else location_dict.get("display_name", "Not Specified")

        description = item.get("description", "")
        description = re.sub(r'<[^>]+>', '', description).strip()

        salary_min = item.get("salary_min")
        salary_max = item.get("salary_max")
        
        posted_str = item.get("created")
        posted_at = None
        if posted_str:
            try:
                posted_at = datetime.fromisoformat(posted_str.replace("Z", "+00:00"))
            except Exception:
                pass

        job_url = item.get("redirect_url") or item.get("url", "")
        category = (item.get("category") or {}).get("label")

        dto = NormalizedJobDTO(
            source=self.source_name,
            source_job_id=raw_dto.source_job_id,
            title=title,
            company_name=company_name,
            location=location,
            country=item.get("country", "in").lower(),
            description=description,
            job_url=job_url,
            salary_min=float(salary_min) if salary_min is not None else None,
            salary_max=float(salary_max) if salary_max is not None else None,
            currency="INR" if item.get("country", "").lower() == "in" else "USD",
            job_type=item.get("contract_time", "Full-time"),
            posted_at=posted_at,
            category=category,
            remote=bool(re.search(r'\bremote\b', f"{title} {description} {location}", re.I))
        )
        dto.compute_content_hash()
        return dto
