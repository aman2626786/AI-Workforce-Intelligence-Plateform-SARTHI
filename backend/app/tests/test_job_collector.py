import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.job import Job, RawJob, JobSource, JobCollectionError, CollectionRun, JobSkill
from backend.app.models.skill import Skill
from backend.app.services.job_crawler.base_connector import RawJobDTO, NormalizedJobDTO, JobSourceConnector
from backend.app.services.job_crawler.validator import JobValidator
from backend.app.services.job_crawler.deduplicator import JobDeduplicator
from backend.app.services.job_crawler.role_classifier import RoleClassifier
from backend.app.services.job_crawler.job_skill_extractor import JobSkillExtractor
from backend.app.services.job_crawler.agent import JobCollectionAgent

# Test Database Fixture
@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Seed sample canonical skills
    sample_skills = [
        ("python", "Python", "Programming Languages"),
        ("sql", "SQL", "Databases"),
        ("docker", "Docker", "DevOps & Cloud"),
        ("machine_learning", "Machine Learning", "AI & Data Science"),
        ("react", "React", "Web Frontend")
    ]
    for sid, name, cat in sample_skills:
        db.add(Skill(id=sid, canonical_name=name, category=cat, aliases=[name.lower()]))
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)

# 1. Role Classifier Tests
def test_role_classification():
    classifier = RoleClassifier()

    role, conf = classifier.classify("Senior Data Scientist", "Looking for Python, ML, Pandas expert")
    assert role == "Data Scientist"
    assert conf > 0.8

    role2, conf2 = classifier.classify("DevOps / SRE Engineer", "Kubernetes, Docker, CI/CD pipeline manager")
    assert role2 == "DevOps Engineer"
    assert conf2 > 0.8

    role3, _ = classifier.classify("Frontend React Developer", "Building modern UI components with Next.js")
    assert role3 == "Frontend Developer"

# 2. Job Validator Tests
def test_job_validator():
    # Valid job
    valid_dto = NormalizedJobDTO(
        source="adzuna",
        source_job_id="12345",
        title="Full Stack Software Engineer",
        company_name="Acme Corp",
        country="India",
        location="Bengaluru",
        job_url="https://acme.com/jobs/12345?utm_source=adzuna",
        description="We are seeking a talented full stack software engineer to build scalable web platforms using Python and React."
    )
    is_valid, err = JobValidator.validate(valid_dto)
    assert is_valid is True
    assert err is None

    # Invalid job - title too short
    invalid_title = NormalizedJobDTO(
        source="adzuna",
        source_job_id="1",
        title="SE",
        company_name="Acme",
        country="India",
        location="Bengaluru",
        job_url="https://example.com/job",
        description="A full description with enough words to satisfy the length requirement."
    )
    is_valid, err = JobValidator.validate(invalid_title)
    assert is_valid is False
    assert "title too short" in err.lower()

    # Invalid job - description too short
    invalid_desc = NormalizedJobDTO(
        source="adzuna",
        source_job_id="2",
        title="Senior Python Developer",
        company_name="Acme",
        country="India",
        location="Bengaluru",
        job_url="https://example.com/job",
        description="Short"
    )
    is_valid, err = JobValidator.validate(invalid_desc)
    assert is_valid is False
    assert "description" in err.lower()

    # Spam job
    spam_dto = NormalizedJobDTO(
        source="adzuna",
        source_job_id="3",
        title="Earn Money Fast with No Skills",
        company_name="QuickCash",
        country="India",
        location="Bengaluru",
        job_url="https://example.com/scam",
        description="Make $500 daily no skills needed click this link to claim your reward immediately!"
    )
    is_valid, err = JobValidator.validate(spam_dto)
    assert is_valid is False
    assert "spam" in err.lower()

# 3. Deduplicator Tests
def test_url_normalization():
    dirty_url = "https://careers.google.com/jobs/123/?utm_source=ad&utm_medium=cpc&ref=xyz#apply"
    clean = JobDeduplicator.normalize_url(dirty_url)
    assert clean == "https://careers.google.com/jobs/123"

def test_deduplicator(test_db):
    dto = NormalizedJobDTO(
        source="adzuna",
        source_job_id="adz_101",
        title="Senior Python Developer",
        company_name="TechCorp India",
        country="India",
        location="Pune",
        job_url="https://techcorp.com/careers/py101?utm_campaign=winter",
        description="Looking for an experienced Senior Python developer to join our core backend engineering team in Pune."
    )
    role = "Backend Developer"

    # Initially not duplicate
    is_dup, dup_id, reason = JobDeduplicator.check_duplicate(test_db, dto, role)
    assert is_dup is False

    # Insert canonical job
    clean_url = JobDeduplicator.normalize_url(dto.job_url)
    content_hash = JobDeduplicator.compute_content_hash(role, dto.company_name, dto.description)
    job = Job(
        source=dto.source,
        source_job_id=dto.source_job_id,
        title=dto.title,
        company_name=dto.company_name,
        canonical_role=role,
        country=dto.country,
        location=dto.location,
        job_url=clean_url,
        content_hash=content_hash,
        description=dto.description,
        status="ACTIVE"
    )
    test_db.add(job)
    test_db.flush()

    source = JobSource(
        job_id=job.id,
        source=dto.source,
        source_job_id=dto.source_job_id,
        source_url=clean_url
    )
    test_db.add(source)
    test_db.commit()

    # Exact source_job_id duplicate check
    is_dup2, existing_id, reason2 = JobDeduplicator.check_duplicate(test_db, dto, role)
    assert is_dup2 is True
    assert existing_id == job.id
    assert reason2 == "exact_source_id_match"

    # Cross-source duplicate with same content from Jooble
    jooble_dto = NormalizedJobDTO(
        source="jooble",
        source_job_id="jooble_999",
        title="Senior Python Developer",
        company_name="TechCorp India",
        country="India",
        location="Pune",
        job_url="https://jooble.org/desc/999",
        description="Looking for an experienced Senior Python developer to join our core backend engineering team in Pune."
    )
    is_dup3, existing_id3, reason3 = JobDeduplicator.check_duplicate(test_db, jooble_dto, role)
    assert is_dup3 is True
    assert existing_id3 == job.id
    assert reason3 == "content_hash_match"

# 4. Job Skill Extractor Tests
def test_job_skill_extractor(test_db):
    extractor = JobSkillExtractor()

    job = Job(
        source="test",
        source_job_id="test_ml_1",
        title="Senior Machine Learning & Python Engineer",
        company_name="AI Labs",
        canonical_role="Machine Learning Engineer",
        country="India",
        location="Bengaluru",
        job_url="https://example.com/ml1",
        content_hash="hash_ml_123",
        description="You will work with Python, SQL, Docker, and Machine Learning models to deploy intelligent solutions.",
        status="ACTIVE"
    )
    test_db.add(job)
    test_db.flush()

    extracted = extractor.extract_from_job(test_db, job)
    test_db.commit()

    job_skills = test_db.query(JobSkill).filter_by(job_id=job.id).all()
    assert len(job_skills) >= 3

    skill_ids = {js.skill_id for js in job_skills}
    canonical_names = {s.canonical_name for s in test_db.query(Skill).filter(Skill.id.in_(skill_ids)).all()}

    assert "Python" in canonical_names
    assert "SQL" in canonical_names
    assert "Docker" in canonical_names

# 5. Mock Connector & Full Agent Run
class MockConnector(JobSourceConnector):
    def __init__(self):
        super().__init__(source_name="mock_source")

    async def fetch_jobs(self, query, location=None, page=1):
        return [
            RawJobDTO(
                source="mock_source",
                source_job_id=f"mock_{query}_{page}",
                raw_payload={
                    "title": f"Lead {query}",
                    "company": "Innovation Cloud",
                    "location": "Bengaluru",
                    "url": f"https://cloud.example.com/jobs/{query}?utm_source=test",
                    "description": f"We are hiring a Lead {query} with extensive expertise in Python, SQL, and Docker container architectures."
                }
            )
        ]

    def normalize_job(self, raw):
        p = raw.raw_payload
        return NormalizedJobDTO(
            source=raw.source,
            source_job_id=raw.source_job_id,
            title=p["title"],
            company_name=p["company"],
            country="India",
            location="Bengaluru",
            job_url=p["url"],
            description=p["description"]
        )

def test_agent_orchestrator_mock(test_db, monkeypatch):
    # Route agent SessionLocal to in-memory test db
    monkeypatch.setattr("backend.app.services.job_crawler.agent.SessionLocal", lambda: test_db)

    mock_conn = MockConnector()
    agent = JobCollectionAgent(connectors=[mock_conn])

    summary = asyncio.run(agent.run(
        sources=["mock_source"],
        roles=["Software Engineer"],
        locations=["Bengaluru"],
        pages_per_query=1
    ))

    assert summary["total_fetched"] == 1
    assert summary["total_inserted"] == 1
    assert summary["total_errors"] == 0

    # Verify Job record inserted
    job = test_db.query(Job).first()
    assert job is not None
    assert "Software Engineer" in job.title

    # Verify linked source
    source = test_db.query(JobSource).filter_by(job_id=job.id).first()
    assert source is not None
    assert source.source == "mock_source"

    # Verify skills extracted
    skills = test_db.query(JobSkill).filter_by(job_id=job.id).all()
    assert len(skills) >= 2
