#!/usr/bin/env python
"""
CLI runner for the Job Collection Agent.
Usage:
    python backend/scripts/run_job_collector.py --sources adzuna jooble --roles "Data Scientist"
    python backend/scripts/run_job_collector.py --stats
    python backend/scripts/run_job_collector.py --all
"""
import sys
import os
import argparse
import asyncio
import logging

# Ensure project root is in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.core.database import SessionLocal
from backend.app.models.job import Job, JobSource, JobCollectionError, CollectionRun
from backend.app.services.job_crawler.agent import JobCollectionAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("job_collector_cli")

def show_stats():
    db = SessionLocal()
    try:
        total_jobs = db.query(Job).count()
        active_jobs = db.query(Job).filter(Job.status == "ACTIVE").count()
        total_sources = db.query(JobSource).count()
        total_errors = db.query(JobCollectionError).count()
        recent_runs = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).limit(5).all()

        print("\n========================================================")
        print("          JOB COLLECTION AGENT DATABASE STATS           ")
        print("========================================================")
        print(f" Total Jobs in Database : {total_jobs}")
        print(f" Active Job Postings    : {active_jobs}")
        print(f" Linked Source Postings : {total_sources}")
        print(f" Total Collection Errors: {total_errors}")
        print("\n Recent Collection Runs:")
        print(f" {'ID':<38} {'Source':<15} {'Status':<10} {'Fetched':<8} {'Inserted':<9} {'Errors'}")
        print("-" * 90)
        for r in recent_runs:
            print(f" {r.id:<38} {r.source:<15} {r.status:<10} {r.jobs_fetched:<8} {r.jobs_inserted:<9} {r.errors}")
        print("========================================================\n")
    finally:
        db.close()

async def main_async(args):
    agent = JobCollectionAgent()
    sources = args.sources if args.sources else None
    roles = args.roles if args.roles else None
    locations = args.locations if args.locations else None
    pages = args.pages or 1

    print(f"\n[+] Initiating Job Collection Agent...")
    print(f"    Target Sources   : {sources or 'All configured'}")
    print(f"    Target Roles     : {roles or 'Standard taxonomy'}")
    print(f"    Target Locations : {locations or 'India, Remote, US'}")
    print(f"    Pages Per Query  : {pages}\n")

    summary = await agent.run(
        sources=sources,
        roles=roles,
        locations=locations,
        pages_per_query=pages
    )

    print("\n========================================================")
    print("             JOB COLLECTION CYCLE SUMMARY               ")
    print("========================================================")
    print(f" Sources Processed : {summary['sources_run']}")
    print(f" Total Fetched     : {summary['total_fetched']}")
    print(f" Total Inserted    : {summary['total_inserted']}")
    print(f" Total Duplicates  : {summary['total_duplicates']}")
    print(f" Total Invalid     : {summary['total_invalid']}")
    print(f" Total Errors      : {summary['total_errors']}")
    print("========================================================\n")

def main():
    parser = argparse.ArgumentParser(description="Job Collection Agent CLI Runner")
    parser.add_argument("--sources", "-s", nargs="+", help="Sources to crawl: adzuna, jooble, usajobs, company_career")
    parser.add_argument("--roles", "-r", nargs="+", help="Job roles/queries to crawl")
    parser.add_argument("--locations", "-l", nargs="+", help="Locations to crawl")
    parser.add_argument("--pages", "-p", type=int, default=1, help="Number of pages per role/location")
    parser.add_argument("--stats", action="store_true", help="Display crawler database statistics")
    parser.add_argument("--all", action="store_true", help="Run full crawler across all sources")

    args = parser.parse_args()

    if args.stats:
        show_stats()
        return

    asyncio.run(main_async(args))

if __name__ == "__main__":
    main()
