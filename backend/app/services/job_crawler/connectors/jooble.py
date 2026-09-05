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

class JoobleConnector(JobSourceConnector):
    """
    Connector for Jooble Job Search API.
    Supports regional API keys (e.g. JOOBLE_IN_API_KEY, JOOBLE_US_API_KEY).
    """

    BASE_URL = "https://jooble.org/api"

    def __init__(
        self,
        api_key: Optional[str] = None,
        rate_limit_rps: float = 2.0,
        max_concurrency: int = 2,
        timeout_seconds: float = 15.0
    ):
        super().__init__(
            source_name="jooble",
            rate_limit_rps=rate_limit_rps,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            max_retries=3
        )
        self.default_key = api_key or settings.JOOBLE_API_KEY
        self.regional_keys = {
            "in": settings.JOOBLE_IN_API_KEY or self.default_key,
            "us": settings.JOOBLE_US_API_KEY or self.default_key,
            "gb": settings.JOOBLE_UK_API_KEY or self.default_key,
            "uk": settings.JOOBLE_UK_API_KEY or self.default_key,
        }

    def get_api_key_for_country(self, country: str) -> Optional[str]:
        c = country.lower()
        return self.regional_keys.get(c) or self.default_key

    def is_configured(self, country: str = "in") -> bool:
        return bool(self.get_api_key_for_country(country))

    async def fetch_jobs(
        self,
        role_query: str = "",
        country: str = "in",
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        location: Optional[str] = None,
        **kwargs
    ) -> List[RawJobDTO]:
        target_role = query or role_query
        target_location = location or country

        # Infer 2-letter country code
        c_code = "in"
        loc_lower = target_location.lower()
        if "us" in loc_lower or "united states" in loc_lower:
            c_code = "us"
        elif "uk" in loc_lower or "gb" in loc_lower or "britain" in loc_lower:
            c_code = "gb"
        elif "ca" in loc_lower or "canada" in loc_lower:
            c_code = "ca"

        api_key = self.get_api_key_for_country(c_code)
        if not api_key:
            logger.warning(f"[JoobleConnector] API key for country '{c_code}' not configured. Skipping.")
            return []

        # Construct country-specific Jooble API endpoint
        if c_code == "in":
            url = f"https://in.jooble.org/api/{api_key}"
        elif c_code in ("gb", "uk"):
            url = f"https://uk.jooble.org/api/{api_key}"
        elif c_code == "ca":
            url = f"https://ca.jooble.org/api/{api_key}"
        else:
            url = f"https://in.jooble.org/api/{api_key}"

        payload = {
            "keywords": target_role,
            "location": target_location if target_location not in ("in", "us", "gb", "ca") else "",
            "page": page,
        }

        async def _make_request():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                res.raise_for_status()
                return res.json()

        try:
            data = await self.execute_with_retry(_make_request)
            jobs_list = data.get("jobs", [])
            raw_dtos = []
            for item in jobs_list:
                job_id = str(item.get("id") or item.get("link", ""))
                # Store country info in payload for normalization
                item["_country"] = country.lower()
                raw_dtos.append(RawJobDTO(
                    source=self.source_name,
                    source_job_id=job_id,
                    raw_payload=item,
                    fetched_at=datetime.utcnow()
                ))
            return raw_dtos
        except Exception as e:
            logger.error(f"[JoobleConnector] Error fetching jobs for {role_query} in {country}: {e}")
            raise

    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        item = raw_dto.raw_payload

        title = item.get("title", "")
        title = re.sub(r'<[^>]+>', '', title).strip()

        company_name = item.get("company", "").strip() or "Hiring Organization"
        location = item.get("location", "").strip() or "Not Specified"
        
        snippet = item.get("snippet", "")
        description = re.sub(r'<[^>]+>', '', snippet).strip()

        salary_str = item.get("salary", "")
        salary_min = None
        salary_max = None
        if salary_str:
            numbers = [float(s.replace(',', '')) for s in re.findall(r'[\d,]+', salary_str) if s.replace(',', '').isdigit()]
            if len(numbers) >= 2:
                salary_min, salary_max = numbers[0], numbers[1]
            elif len(numbers) == 1:
                salary_min = numbers[0]

        posted_str = item.get("updated")
        posted_at = None
        if posted_str:
            try:
                posted_at = datetime.fromisoformat(posted_str.replace("Z", "+00:00"))
            except Exception:
                pass

        job_url = item.get("link", "")
        country = item.get("_country", "in")

        dto = NormalizedJobDTO(
            source=self.source_name,
            source_job_id=raw_dto.source_job_id,
            title=title,
            company_name=company_name,
            location=location,
            country=country,
            description=description,
            job_url=job_url,
            salary_min=salary_min,
            salary_max=salary_max,
            currency="INR" if country == "in" else "USD",
            job_type=item.get("type", "Full-time"),
            posted_at=posted_at,
            remote=bool(re.search(r'\bremote\b', f"{title} {description} {location}", re.I))
        )
        dto.compute_content_hash()
        return dto
