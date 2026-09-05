import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import httpx
from urllib.parse import urlparse

from backend.app.services.job_crawler.base_connector import (
    JobSourceConnector,
    RawJobDTO,
    NormalizedJobDTO,
)

logger = logging.getLogger(__name__)

class CompanyCareerConnector(JobSourceConnector):
    """
    Future-ready connector for direct corporate career pages and public JSON/ATS endpoints.
    Strictly adheres to:
    - robots.txt permissions
    - No bypassing of CAPTCHA, authentication, or access controls.
    """

    def __init__(
        self,
        company_name: str = "Direct Careers",
        career_url: str = "",
        allowed: bool = True,
        rate_limit_rps: float = 0.5,
        max_concurrency: int = 1,
        timeout_seconds: float = 15.0
    ):
        super().__init__(
            source_name=f"career_{company_name.lower().replace(' ', '_')}",
            rate_limit_rps=rate_limit_rps,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            max_retries=2
        )
        self.company_name = company_name
        self.career_url = career_url
        self.allowed = allowed

    async def is_robots_allowed(self) -> bool:
        """
        Checks if root /robots.txt disallows automated crawler access.
        """
        try:
            parsed = urlparse(self.career_url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(robots_url)
                if res.status_code == 200:
                    text = res.text.lower()
                    if "disallow: /" in text and "user-agent: *" in text:
                        return False
            return True
        except Exception:
            return True

    async def fetch_jobs(
        self,
        role_query: str,
        country: str = "in",
        page: int = 1,
        limit: int = 20
    ) -> List[RawJobDTO]:
        if not self.allowed:
            logger.info(f"[CompanyCareerConnector] Automated access not permitted for {self.company_name}.")
            return []

        robots_ok = await self.is_robots_allowed()
        if not robots_ok:
            logger.warning(f"[CompanyCareerConnector] robots.txt restricts crawler on {self.career_url}. Aborting.")
            return []

        # Future expansion: integrate with structured public ATS feeds (e.g. Greenhouse / Lever public APIs)
        logger.info(f"[CompanyCareerConnector] Checked permitted endpoint for {self.company_name}.")
        return []

    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        payload = raw_dto.raw_payload
        dto = NormalizedJobDTO(
            source=self.source_name,
            source_job_id=raw_dto.source_job_id,
            title=payload.get("title", ""),
            company_name=self.company_name,
            location=payload.get("location", "Not Specified"),
            country="in",
            description=payload.get("description", ""),
            job_url=payload.get("url", self.career_url),
        )
        dto.compute_content_hash()
        return dto
