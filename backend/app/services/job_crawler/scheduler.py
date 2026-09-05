import asyncio
import logging
from datetime import datetime, time, timedelta
from typing import Optional

from backend.app.core.config import settings
from backend.app.services.job_crawler.agent import JobCollectionAgent

logger = logging.getLogger("job_crawler.scheduler")

class JobCrawlerScheduler:
    """
    Lightweight, dependency-free background scheduler for daily job collection.
    By default runs daily at 02:00 UTC (or configured hour).
    """

    def __init__(self, target_hour: int = 2, target_minute: int = 0):
        self.target_hour = target_hour
        self.target_minute = target_minute
        self._task: Optional[asyncio.Task] = None
        self._is_running = False
        self.agent = JobCollectionAgent()

    def _seconds_until_next_run(self) -> float:
        now = datetime.utcnow()
        target = now.replace(hour=self.target_hour, minute=self.target_minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)
        return (target - now).total_seconds()

    async def _loop(self):
        logger.info(f"JobCrawlerScheduler started. Next run scheduled for {self.target_hour:02d}:{self.target_minute:02d} UTC.")
        while self._is_running:
            delay = self._seconds_until_next_run()
            logger.info(f"Job crawler sleeping for {int(delay)} seconds until next scheduled run.")
            try:
                await asyncio.sleep(delay)
                if not self._is_running:
                    break

                logger.info("Triggering scheduled daily job collection...")
                await self.agent.run(pages_per_query=settings.CRAWLER_MAX_PAGES_PER_QUERY)
            except asyncio.CancelledError:
                logger.info("JobCrawlerScheduler loop cancelled.")
                break
            except Exception as e:
                logger.error(f"Error executing scheduled job collection run: {e}")
                # Wait 10 minutes before retrying on unexpected crash
                await asyncio.sleep(600)

    def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._loop())

    def stop(self):
        if not self._is_running:
            return
        self._is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("JobCrawlerScheduler stopped.")

# Global scheduler instance
scheduler = JobCrawlerScheduler()
