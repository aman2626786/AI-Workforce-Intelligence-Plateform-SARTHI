"""
Idempotent Import Script for Skill Intelligence Engine:
- Seeds/Updates Role Families & Canonical Roles from `roles_taxonomy.json`
- Seeds/Updates Canonical Skills, Aliases, and Relationships from `skills_ontology.json`
- Migrates any existing database schema columns safely.
"""

import sys
import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models import (
    Skill, SkillAlias, SkillRelationship, RoleFamily, Role, Job, JobSkill
)
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("import_ontology")

def apply_column_migrations():
    """Safely adds new columns if they do not exist yet in SQLite/PostgreSQL."""
    with engine.connect() as conn:
        # Check jobs columns
        try:
            conn.execute(text("SELECT processing_state FROM jobs LIMIT 1"))
        except Exception:
            logger.info("Migrating table 'jobs' - adding processing_state, role_id, role_confidence...")
            try:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN processing_state VARCHAR(30) DEFAULT 'RAW'"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN role_id VARCHAR(50)"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN role_confidence FLOAT DEFAULT 0.0"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN role_classification_method VARCHAR(50)"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN processing_attempts INTEGER DEFAULT 0"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN last_processed_at TIMESTAMP"))
                conn.execute(text("ALTER TABLE jobs ADD COLUMN processing_error TEXT"))
                conn.commit()
            except Exception as e:
                logger.warning(f"Note on jobs migration: {e}")

        # Check job_skills columns
        try:
            conn.execute(text("SELECT requirement_type FROM job_skills LIMIT 1"))
        except Exception:
            logger.info("Migrating table 'job_skills' - adding requirement_type, evidence_text...")
            try:
                conn.execute(text("ALTER TABLE job_skills ADD COLUMN requirement_type VARCHAR(20) DEFAULT 'UNKNOWN'"))
                conn.execute(text("ALTER TABLE job_skills ADD COLUMN evidence_text TEXT"))
                conn.execute(text("ALTER TABLE job_skills ADD COLUMN section VARCHAR(50)"))
                conn.execute(text("ALTER TABLE job_skills ADD COLUMN start_pos INTEGER"))
                conn.execute(text("ALTER TABLE job_skills ADD COLUMN end_pos INTEGER"))
                conn.commit()
            except Exception as e:
                logger.warning(f"Note on job_skills migration: {e}")

        # Check skills columns
        try:
            conn.execute(text("SELECT subcategory FROM skills LIMIT 1"))
        except Exception:
            logger.info("Migrating table 'skills' - adding subcategory, description, active...")
            try:
                conn.execute(text("ALTER TABLE skills ADD COLUMN subcategory VARCHAR(100)"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN description TEXT"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN parent_skill_id VARCHAR(50)"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN source VARCHAR(50) DEFAULT 'mind_ontology'"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN confidence FLOAT DEFAULT 1.0"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN active BOOLEAN DEFAULT 1"))
                conn.execute(text("ALTER TABLE skills ADD COLUMN updated_at TIMESTAMP"))
                conn.commit()
            except Exception as e:
                logger.warning(f"Note on skills migration: {e}")

def import_roles(db):
    roles_file = PROJECT_ROOT / "backend" / "app" / "data" / "roles_taxonomy.json"
    if not roles_file.exists():
        logger.error(f"Roles file not found at {roles_file}")
        return

    with open(roles_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Families
    fam_count = 0
    for fam in data.get("families", []):
        existing = db.query(RoleFamily).filter(RoleFamily.id == fam["id"]).first()
        if not existing:
            family = RoleFamily(
                id=fam["id"],
                name=fam["name"],
                code=fam["code"],
                description=fam.get("description")
            )
            db.add(family)
            fam_count += 1
        else:
            existing.name = fam["name"]
            existing.code = fam["code"]
            existing.description = fam.get("description")
    db.commit()
    logger.info(f"Imported/Updated {len(data.get('families', []))} role families ({fam_count} newly inserted).")

    # 2. Roles
    role_count = 0
    for r in data.get("roles", []):
        existing = db.query(Role).filter(Role.id == r["id"]).first()
        if not existing:
            role = Role(
                id=r["id"],
                family_id=r["family_id"],
                name=r["name"],
                code=r["code"],
                description=r.get("description"),
                aliases=r.get("aliases", []),
                queries=r.get("queries", []),
                active=True
            )
            db.add(role)
            role_count += 1
        else:
            existing.family_id = r["family_id"]
            existing.name = r["name"]
            existing.code = r["code"]
            existing.description = r.get("description")
            existing.aliases = r.get("aliases", [])
            existing.queries = r.get("queries", [])
    db.commit()
    logger.info(f"Imported/Updated {len(data.get('roles', []))} roles ({role_count} newly inserted).")

def import_skills_and_ontology(db):
    ontology_file = PROJECT_ROOT / "backend" / "app" / "data" / "skills_ontology.json"
    if not ontology_file.exists():
        logger.error(f"Ontology file not found at {ontology_file}")
        return

    with open(ontology_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    skills_data = data.get("skills", [])
    skill_count = 0
    alias_count = 0
    rel_count = 0

    # Build mapping from JSON ID and canonical name to DB Skill ID
    json_to_db_id = {}

    # 1. Skills
    for item in skills_data:
        skill_id = item["id"]
        canonical_name = item["canonical_name"]
        existing = db.query(Skill).filter((Skill.id == skill_id) | (Skill.canonical_name == canonical_name)).first()
        
        aliases_list = [a.lower().strip() for a in item.get("aliases", [])]
        if not existing:
            skill = Skill(
                id=skill_id,
                canonical_name=canonical_name,
                category=item["category"],
                subcategory=item.get("subcategory"),
                description=item.get("description"),
                aliases=aliases_list,
                source="mind_ontology",
                confidence=1.0,
                active=True
            )
            db.add(skill)
            db.flush()
            skill_count += 1
            existing = skill
        else:
            existing.canonical_name = canonical_name
            existing.category = item["category"]
            existing.subcategory = item.get("subcategory")
            existing.description = item.get("description")
            existing.aliases = list(set((existing.aliases or []) + aliases_list))
            db.flush()

        json_to_db_id[skill_id] = existing.id
        json_to_db_id[canonical_name] = existing.id

        # 2. Aliases in separate table
        for alias_str in aliases_list:
            alias_norm = alias_str.lower().strip()
            existing_alias = db.query(SkillAlias).filter(
                SkillAlias.skill_id == existing.id,
                SkillAlias.alias_norm == alias_norm
            ).first()
            if not existing_alias:
                alias_obj = SkillAlias(
                    skill_id=existing.id,
                    alias=alias_str,
                    alias_norm=alias_norm,
                    source="mind_ontology",
                    is_abbreviation=len(alias_str) <= 4
                )
                db.add(alias_obj)
                alias_count += 1

    db.commit()
    logger.info(f"Imported/Updated {len(skills_data)} canonical skills ({skill_count} newly inserted, {alias_count} aliases created).")

    # 3. Relationships
    for item in skills_data:
        source_json_id = item["id"]
        source_db_id = json_to_db_id.get(source_json_id)
        if not source_db_id:
            continue

        for rel in item.get("relationships", []):
            target_json_id = rel["target"]
            target_db_id = json_to_db_id.get(target_json_id)
            if not target_db_id:
                # Try finding target skill by ID in DB
                target_skill = db.query(Skill).filter(Skill.id == target_json_id).first()
                if target_skill:
                    target_db_id = target_skill.id

            if target_db_id and source_db_id != target_db_id:
                relation_type = rel["relation"]
                existing_rel = db.query(SkillRelationship).filter(
                    SkillRelationship.source_skill_id == source_db_id,
                    SkillRelationship.target_skill_id == target_db_id,
                    SkillRelationship.relation_type == relation_type
                ).first()
                if not existing_rel:
                    rel_obj = SkillRelationship(
                        source_skill_id=source_db_id,
                        target_skill_id=target_db_id,
                        relation_type=relation_type,
                        confidence=1.0
                    )
                    db.add(rel_obj)
                    rel_count += 1
    db.commit()
    logger.info(f"Imported {rel_count} skill relationships.")

def main():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    apply_column_migrations()

    db = SessionLocal()
    try:
        logger.info("Starting idempotent import of role taxonomy...")
        import_roles(db)
        logger.info("Starting idempotent import of skills ontology...")
        import_skills_and_ontology(db)
        logger.info("Ontology & Taxonomy import completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
