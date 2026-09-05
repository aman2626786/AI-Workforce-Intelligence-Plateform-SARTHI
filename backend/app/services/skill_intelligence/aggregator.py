"""
RoleSkillAggregator:
Calculates industry skill demand and importance metrics:
- role-wise skill demand percentage: (jobs mentioning skill / total role jobs) * 100
- required vs preferred distribution
- importance score: (1.5 * required_count + 0.8 * preferred_count) / total_jobs
- takes immutable historical monthly snapshots into `skill_demand_snapshots`
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.job import Job, JobSkill
from backend.app.models.role import Role
from backend.app.models.skill import Skill
from backend.app.models.intelligence import RoleSkillDemand, SkillDemandSnapshot

class RoleSkillAggregator:
    def __init__(self, db: Session):
        self.db = db

    def aggregate_role_skills(self) -> Dict[str, Any]:
        """
        Recomputes real-time role-skill demand for all active roles across all jobs.
        Updates `role_skill_demands` table.
        """
        # 1. Total jobs per role
        role_job_counts = dict(
            self.db.query(Job.role_id, func.count(Job.id))
            .filter(Job.status == "ACTIVE", Job.role_id.isnot(None))
            .group_by(Job.role_id)
            .all()
        )

        # 2. Query skills linked to jobs grouped by role and requirement type
        query = (
            self.db.query(
                Job.role_id,
                JobSkill.skill_id,
                JobSkill.requirement_type,
                func.count(Job.id)
            )
            .join(JobSkill, Job.id == JobSkill.job_id)
            .filter(Job.status == "ACTIVE", Job.role_id.isnot(None))
            .group_by(Job.role_id, JobSkill.skill_id, JobSkill.requirement_type)
            .all()
        )

        # Group data: (role_id, skill_id) -> {'total_jobs': N, 'job_count': M, 'req': R, 'pref': P}
        agg_map = {}
        for role_id, skill_id, req_type, count in query:
            key = (role_id, skill_id)
            if key not in agg_map:
                tot = role_job_counts.get(role_id, 0)
                agg_map[key] = {
                    "total_jobs": tot,
                    "job_count": 0,
                    "required_count": 0,
                    "preferred_count": 0
                }

            agg_map[key]["job_count"] += count
            if req_type == "REQUIRED":
                agg_map[key]["required_count"] += count
            elif req_type == "PREFERRED":
                agg_map[key]["preferred_count"] += count

        updated_count = 0
        inserted_count = 0

        for (role_id, skill_id), metrics in agg_map.items():
            tot = metrics["total_jobs"]
            j_count = metrics["job_count"]
            req_c = metrics["required_count"]
            pref_c = metrics["preferred_count"]

            demand_pct = round((j_count / tot * 100), 2) if tot > 0 else 0.0
            importance = round(((1.5 * req_c + 0.8 * pref_c) / max(1, tot)), 2)

            record = self.db.query(RoleSkillDemand).filter(
                RoleSkillDemand.role_id == role_id,
                RoleSkillDemand.skill_id == skill_id
            ).first()

            if record:
                record.job_count = j_count
                record.total_jobs = tot
                record.demand_percentage = demand_pct
                record.required_count = req_c
                record.preferred_count = pref_c
                record.importance_score = importance
                record.updated_at = datetime.now(timezone.utc)
                updated_count += 1
            else:
                record = RoleSkillDemand(
                    role_id=role_id,
                    skill_id=skill_id,
                    job_count=j_count,
                    total_jobs=tot,
                    demand_percentage=demand_pct,
                    required_count=req_c,
                    preferred_count=pref_c,
                    importance_score=importance
                )
                self.db.add(record)
                inserted_count += 1

        self.db.commit()
        return {
            "updated_demands": updated_count,
            "inserted_demands": inserted_count,
            "roles_evaluated": len(role_job_counts)
        }

    def create_monthly_snapshot(self, snapshot_month: Optional[str] = None) -> int:
        """
        Creates an immutable snapshot for historical trend analysis.
        snapshot_month format: 'YYYY-MM', defaults to current month.
        """
        if not snapshot_month:
            snapshot_month = datetime.now(timezone.utc).strftime("%Y-%m")

        # Total jobs per (role_id, country)
        totals_query = (
            self.db.query(
                Job.role_id,
                Job.country,
                func.count(Job.id)
            )
            .filter(Job.status == "ACTIVE", Job.role_id.isnot(None))
            .group_by(Job.role_id, Job.country)
            .all()
        )
        role_country_totals = {
            (role_id, country): count for role_id, country, count in totals_query
        }

        # Query skill counts per role, country
        query = (
            self.db.query(
                Job.role_id,
                Job.country,
                JobSkill.skill_id,
                func.count(func.distinct(Job.id))
            )
            .join(JobSkill, Job.id == JobSkill.job_id)
            .filter(Job.status == "ACTIVE", Job.role_id.isnot(None))
            .group_by(Job.role_id, Job.country, JobSkill.skill_id)
            .all()
        )

        snapshots_saved = 0
        for role_id, country, skill_id, skill_job_count in query:
            tot = role_country_totals.get((role_id, country), 0)
            demand_pct = round((skill_job_count / tot * 100), 2) if tot > 0 else 0.0

            # Upsert into snapshot table
            existing = self.db.query(SkillDemandSnapshot).filter(
                SkillDemandSnapshot.role_id == role_id,
                SkillDemandSnapshot.country == country,
                SkillDemandSnapshot.snapshot_month == snapshot_month,
                SkillDemandSnapshot.skill_id == skill_id
            ).first()

            if existing:
                existing.job_count = skill_job_count
                existing.total_jobs = tot
                existing.demand_percentage = demand_pct
            else:
                snapshot = SkillDemandSnapshot(
                    role_id=role_id,
                    country=country,
                    snapshot_month=snapshot_month,
                    skill_id=skill_id,
                    job_count=skill_job_count,
                    total_jobs=tot,
                    demand_percentage=demand_pct
                )
                self.db.add(snapshot)
                snapshots_saved += 1

        self.db.commit()
        return snapshots_saved
