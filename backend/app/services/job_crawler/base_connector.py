import asyncio
import hashlib
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import httpx

@dataclass
class RawJobDTO:
    source: str
    source_job_id: str
    raw_payload: Dict[str, Any]
    fetched_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class NormalizedJobDTO:
    source: str
    source_job_id: str
    title: str
    company_name: str
    location: Optional[str]
    country: str
    description: str
    job_url: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    job_type: Optional[str] = "Full-time"
    posted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    category: Optional[str] = None
    remote: bool = False
    content_hash: str = ""

    def compute_content_hash(self) -> str:
        """
        SHA-256 fingerprint from title + company + first 200 chars of normalized description
        """
        norm_title = "".join(self.title.lower().split())
        norm_comp = "".join(self.company_name.lower().split())
        desc_snippet = "".join(self.description[:200].lower().split())
        hash_input = f"{norm_title}|{norm_comp}|{desc_snippet}".encode("utf-8")
        self.content_hash = hashlib.sha256(hash_input).hexdigest()
        return self.content_hash

class AsyncRateLimiter:
    """
    Token-bucket rate limiter for controlling API concurrency and requests/sec.
    """
    def __init__(self, requests_per_second: float = 2.0, max_concurrency: int = 3):
        self.rate = requests_per_second
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.last_request_time = 0.0
        self.lock = asyncio.Lock()

    async def acquire(self):
        await self.semaphore.acquire()
        async with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_request_time
            wait_time = (1.0 / self.rate) - elapsed
            if wait_time > 0:
                await asyncio.sleep(wait_time)
            self.last_request_time = time.monotonic()

    def release(self):
        self.semaphore.release()

    async def __aenter__(self):
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.release()

class JobSourceConnector(ABC):
    """
    Abstract Base Class for all Job Source Connectors (Adzuna, Jooble, USAJOBS, etc.)
    """
    def __init__(
        self,
        source_name: str,
        rate_limit_rps: float = 2.0,
        max_concurrency: int = 3,
        timeout_seconds: float = 15.0,
        max_retries: int = 3
    ):
        self.source_name = source_name
        self.rate_limiter = AsyncRateLimiter(rate_limit_rps, max_concurrency)
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    async def execute_with_retry(self, request_fn) -> Any:
        """
        Executes an async network request with exponential backoff and jitter.
        """
        delay = 1.0
        last_exception = None

        for attempt in range(1, self.max_retries + 1):
            async with self.rate_limiter:
                try:
                    return await request_fn()
                except (httpx.TimeoutException, httpx.ConnectError) as net_err:
                    last_exception = net_err
                    if attempt == self.max_retries:
                        raise
                    jitter = random.uniform(0.1, 0.5)
                    await asyncio.sleep(delay + jitter)
                    delay *= 2.0
                except httpx.HTTPStatusError as http_err:
                    last_exception = http_err
                    # 429 Too Many Requests -> wait longer
                    if http_err.response.status_code == 429:
                        retry_after = http_err.response.headers.get("Retry-After")
                        wait_sec = float(retry_after) if retry_after else (delay * 2.5)
                        await asyncio.sleep(wait_sec)
                        delay *= 2.0
                        continue
                    # 5xx Server Errors -> retry
                    elif 500 <= http_err.response.status_code < 600:
                        if attempt == self.max_retries:
                            raise
                        await asyncio.sleep(delay)
                        delay *= 2.0
                    else:
                        # 4xx Client error (401, 403, 404) -> do not retry
                        raise

        raise last_exception or Exception(f"Failed after {self.max_retries} attempts")

    @abstractmethod
    async def fetch_jobs(
        self,
        role_query: str,
        country: str = "in",
        page: int = 1,
        limit: int = 20
    ) -> List[RawJobDTO]:
        """
        Fetches raw job records from the external provider API.
        """
        pass

    @abstractmethod
    def normalize_job(self, raw_dto: RawJobDTO) -> NormalizedJobDTO:
        """
        Transforms raw provider payload into the unified NormalizedJobDTO format.
        """
        pass

    def validate_job(self, job: NormalizedJobDTO) -> Tuple[bool, Optional[str]]:
        """
        Validates whether normalized job meets minimum quality standards.
        """
        if not job.title or len(job.title.strip()) < 2:
            return False, "Missing or invalid job title"
        if not job.company_name or len(job.company_name.strip()) < 1:
            return False, "Missing company name"
        if not job.description or len(job.description.strip()) < 30:
            return False, "Missing or truncated job description"
        if not job.job_url or not (job.job_url.startswith("http://") or job.job_url.startswith("https://")):
            return False, "Invalid or missing job URL"
        if not job.country:
            return False, "Missing country code"
        return True, None
