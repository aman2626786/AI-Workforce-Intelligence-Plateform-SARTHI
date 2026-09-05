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

class USAJobsConnector(JobSourceConnector):
    """
    Connector for USAJOBS Federal Opportunity API.
    Requires USAJOBS_API_KEY and USAJOBS_EMAIL.
    """

    BASE_URL = "https://data.usajobs.gov/api/search"

    def __init__(
        self,
        api_key: Optional[str] = None,
        email: Optional[str] = None,
        rate_limit_rps: float = 2.0,
        max_concurrency: int = 2,
        timeout_seconds: float = 15.0
    ):
        super().__init__(
            source_name="usajobs",
            rate_limit_rps=rate_limit_rps,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            max_retries=3
        )
        self.api_key = api_key or settings.USAJOBS_API_KEY
        self.email = email or settings.USAJOBS_EMAIL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.email)

    async def fetch_jobs(
        self,
        role_query: str,
        country: str = "us",
        page: int = 1,
        limit: int = 20
    ) -> List[RawJobDTO]:
        if not self.is_configured():
            logger.warning("[USAJobsConnector] API key or Email not configured. Skipping live fetch.")
            return []

        headers = {
            "Host": "data.usajobs.gov",
            "User-Agent": self.email,
            "Authorization-Key": self.api_key,
        }
        params = {
            "Keyword": role_query,
            "Page": page,
            "ResultsPerPage": min(limit, 50),
        }

        async def _make_request():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(self.BASE_URL, headers=headers, params=params)
                res.raise_for_status()
                return res.json()

        try:
            data = await self.execute_with_retry(_make_request)
            search_result = data.get("SearchResult", {})
            items = search_result.get("SearchResultItems", [])
            raw_dtos = []
            for item in items:
                desc = item.get("MatchedObjectDescriptor", {})
                job_id = str(desc.get("PositionID") or item.get("MatchedObjectId") or desc.get("ApplyURI", [""])[0])
                raw_dtos.append(RawJobDTO(
                    source=self.source_name,
                    source_job_id=job_id,
                    raw_payload=desc,
                    fetched_at=datetime.utcnow()
                ))
            return raw_dtos
        except Exception as e:
            logger.error(f"[USAJobsConnector] Error fetching USAJOBS for {role_query}: {e}")
            raise

    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        desc = raw_dto.raw_payload

        title = desc.get("PositionTitle", "")
        company_name = desc.get("OrganizationName", "U.S. Federal Government")
        
        location_display = desc.get("PositionLocationDisplay", "")
        if not location_display:
            locations = desc.get("PositionLocation", [])
            if locations:
                location_display = locations[0].get("LocationName", "United States")
            else:
                location_display = "United States"

        # UserArea details
        user_area = desc.get("UserArea", {})
        details = user_area.get("Details", {})
        job_summary = details.get("JobSummary") or ""
        major_duties = " ".join(details.get("MajorDuties", []))
        full_description = f"{job_summary} {major_duties}".strip()
        if not full_description:
            full_description = title

        # Remuneration
        salary_min = None
        salary_max = None
        remuneration = desc.get("PositionRemuneration", [])
        if remuneration:
            try:
                salary_min = float(remuneration[0].get("MinimumRange", 0))
                salary_max = float(remuneration[0].get("MaximumRange", 0))
            except (ValueError, TypeError):
                pass

        # Dates
        pub_date_str = desc.get("PublicationStartDate")
        posted_at = None
        if pub_date_str:
            try:
                posted_at = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
            except Exception:
                pass

        close_date_str = desc.get("ApplicationCloseDate")
        expires_at = None
        if close_date_str:
            try:
                expires_at = datetime.fromisoformat(close_date_str.replace("Z", "+00:00"))
            except Exception:
                pass

        apply_uris = desc.get("ApplyURI", [])
        job_url = apply_uris[0] if apply_uris else f"https://www.usajobs.gov/job/{raw_dto.source_job_id}"

        dto = NormalizedJobDTO(
            source=self.source_name,
            source_job_id=raw_dto.source_job_id,
            title=title,
            company_name=company_name,
            location=location_display,
            country="us",
            description=full_description,
            job_url=job_url,
            salary_min=salary_min,
            salary_max=salary_max,
            currency="USD",
            job_type=desc.get("PositionSchedule", [{}])[0].get("Name", "Full-time") if desc.get("PositionSchedule") else "Full-time",
            posted_at=posted_at,
            expires_at=expires_at,
            category=desc.get("JobCategory", [{}])[0].get("Name") if desc.get("JobCategory") else None,
            remote=bool(details.get("TeleworkEligible", False))
        )
        dto.compute_content_hash()
        return dto
