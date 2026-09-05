import logging
import html
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import httpx
from bs4 import BeautifulSoup

from backend.app.services.job_crawler.base_connector import (
    JobSourceConnector,
    RawJobDTO,
    NormalizedJobDTO,
)

logger = logging.getLogger(__name__)

# Default top tech companies with active Greenhouse boards
DEFAULT_GREENHOUSE_COMPANIES = [
    "postman",
    "stripe",
    "figma",
    "gitlab",
    "razorpay",
    "sentry",
    "reddit",
    "instacart",
    "gusto",
    "automattic",
    "datadog",
    "elastic",
    "pinterest",
]

class GreenhouseConnector(JobSourceConnector):
    """
    Direct ATS connector for Greenhouse public job boards.
    Queries the public Greenhouse Board JSON endpoints without requiring API keys:
    https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
    """

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(
        self,
        companies: Optional[List[str]] = None,
        rate_limit_rps: float = 2.0,
        max_concurrency: int = 2,
        timeout_seconds: float = 15.0
    ):
        super().__init__(
            source_name="greenhouse",
            rate_limit_rps=rate_limit_rps,
            max_concurrency=max_concurrency,
            timeout_seconds=timeout_seconds,
            max_retries=2
        )
        self.companies = companies or DEFAULT_GREENHOUSE_COMPANIES
        self._board_cache: Dict[str, List[Dict[str, Any]]] = {}

    async def fetch_company_jobs(self, company: str) -> List[Dict[str, Any]]:
        """
        Fetches all public jobs from a single company's Greenhouse board.
        Caches in memory to prevent duplicate network calls across multi-role passes.
        """
        c_key = company.strip().lower()
        if c_key in self._board_cache:
            return self._board_cache[c_key]

        url = f"{self.BASE_URL}/{c_key}/jobs?content=true"

        async def _make_request():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers={"Accept": "application/json"})
                if res.status_code == 404:
                    logger.warning(f"[GreenhouseConnector] Company board '{company}' not found (404).")
                    return {"jobs": []}
                res.raise_for_status()
                return res.json()

        try:
            data = await self.execute_with_retry(_make_request)
            jobs = data.get("jobs", [])
            for j in jobs:
                j["_company_token"] = company
            self._board_cache[c_key] = jobs
            return jobs
        except Exception as e:
            logger.error(f"[GreenhouseConnector] Error fetching board for '{company}': {e}")
            return []

    async def fetch_jobs(
        self,
        role_query: str = "",
        country: str = "in",
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        location: Optional[str] = None,
        company_filter: Optional[List[str]] = None,
        **kwargs
    ) -> List[RawJobDTO]:
        target_role = (query or role_query or "").strip().lower()
        target_location = (location or country or "").strip().lower()

        target_companies = company_filter or self.companies
        all_raw_dtos: List[RawJobDTO] = []

        # Tokenize search role for keyword filtering
        role_tokens = [t for t in re.findall(r'\b\w+\b', target_role) if len(t) > 2]

        for company in target_companies:
            company_jobs = await self.fetch_company_jobs(company)

            for job in company_jobs:
                title = job.get("title", "")
                title_lower = title.lower()
                loc_data = job.get("location", {})
                loc_name = (loc_data.get("name") or "").lower() if isinstance(loc_data, dict) else str(loc_data).lower()

                # Filter by role keywords if specified
                if role_tokens:
                    # Match at least one prominent token from target_role (e.g. "python", "developer", "data")
                    has_match = any(token in title_lower for token in role_tokens)
                    if not has_match:
                        continue

                # Filter by location if specified (e.g. "india", "remote", "us")
                if target_location and target_location not in ("all", "global"):
                    loc_matches = (
                        target_location in loc_name
                        or ("remote" in target_location and "remote" in loc_name)
                        or ("india" in target_location and ("india" in loc_name or "in" in loc_name or "bangalore" in loc_name or "bengaluru" in loc_name or "pune" in loc_name or "delhi" in loc_name or "hyderabad" in loc_name or "mumbai" in loc_name or "gurgaon" in loc_name or "noida" in loc_name))
                    )
                    # If location specifically requested and doesn't match and job isn't worldwide remote, skip
                    if not loc_matches and "remote" not in loc_name:
                        continue

                job_id = str(job.get("id"))
                all_raw_dtos.append(RawJobDTO(
                    source=self.source_name,
                    source_job_id=job_id,
                    raw_payload=job,
                    fetched_at=datetime.utcnow()
                ))

        # Paginate results
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        return all_raw_dtos[start_idx:end_idx]

    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        item = raw_dto.raw_payload

        # Clean title
        title = item.get("title", "").strip()

        # Company name
        company_name = item.get("company_name", "")
        if not company_name:
            company_name = item.get("_company_token", "Tech Organization").capitalize()

        # Location parsing
        loc_data = item.get("location", {})
        loc_str = loc_data.get("name", "Remote") if isinstance(loc_data, dict) else str(loc_data or "Remote")

        # Determine country & remote flag
        loc_lower = loc_str.lower()
        is_remote = "remote" in loc_lower or "anywhere" in loc_lower or "virtual" in loc_lower or "wfh" in loc_lower
        
        country = "IN"
        if "india" in loc_lower or "bengaluru" in loc_lower or "bangalore" in loc_lower or "delhi" in loc_lower or "hyderabad" in loc_lower or "pune" in loc_lower or "mumbai" in loc_lower:
            country = "IN"
        elif "united states" in loc_lower or "usa" in loc_lower or "san francisco" in loc_lower or "new york" in loc_lower:
            country = "US"
        elif "united kingdom" in loc_lower or "london" in loc_lower or "uk" in loc_lower:
            country = "GB"
        elif is_remote:
            country = "Global"

        # HTML Description cleaning
        raw_html = item.get("content", "")
        if raw_html:
            # Unescape HTML entities (e.g. &lt;p&gt; -> <p>)
            unescaped = html.unescape(raw_html)
            soup = BeautifulSoup(unescaped, "html.parser")
            description = soup.get_text(separator="\n").strip()
            # Collapse excess whitespace
            description = re.sub(r'\n{3,}', '\n\n', description)
        else:
            description = f"Job opportunity for {title} at {company_name}. Location: {loc_str}."

        # Job URL
        job_url = item.get("absolute_url") or f"https://boards.greenhouse.io/{item.get('_company_token')}/jobs/{raw_dto.source_job_id}"

        # Posted/Updated timestamp
        posted_at = None
        updated_str = item.get("updated_at")
        if updated_str:
            try:
                posted_at = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
            except Exception:
                posted_at = datetime.utcnow()

        dto = NormalizedJobDTO(
            source=self.source_name,
            source_job_id=raw_dto.source_job_id,
            title=title,
            company_name=company_name,
            location=loc_str,
            country=country,
            description=description,
            job_url=job_url,
            posted_at=posted_at or datetime.utcnow(),
            remote=is_remote,
            job_type="Full-time"
        )
        dto.compute_content_hash()
        return dto
