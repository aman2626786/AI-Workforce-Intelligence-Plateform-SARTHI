"""
TrendEngine:
Calculates historical momentum and directional trends for skills:
- absolute_change = current_demand - previous_demand
- percentage_change = (current_demand - previous_demand) / previous_demand * 100
- trend_label: RISING_FAST, RISING, STABLE, DECLINING, DECLINING_FAST
- Emerging Skill Detection: velocity + positive growth + minimum footprint
- Strict requirement: at least 2 snapshot periods required for trends
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.models.intelligence import SkillDemandSnapshot, SkillTrend
from backend.app.models.role import Role

class TrendEngine:
    def __init__(self, db: Session):
        self.db = db

        # Configurable thresholds
        self.RISING_FAST_THRESHOLD = 20.0
        self.RISING_THRESHOLD = 5.0
        self.DECLINING_THRESHOLD = -5.0
        self.DECLINING_FAST_THRESHOLD = -20.0
        self.EMERGING_MIN_GROWTH = 15.0

    def calculate_trends_for_role(self, role_id: str, country: str = "ALL") -> List[Dict[str, Any]]:
        """
        Calculates skill trends for a given role comparing the two most recent monthly snapshots.
        """
        # Find distinct snapshot months for this role
        months = [
            m[0] for m in self.db.query(SkillDemandSnapshot.snapshot_month)
            .filter(SkillDemandSnapshot.role_id == role_id)
            .distinct()
            .order_by(desc(SkillDemandSnapshot.snapshot_month))
            .limit(2)
            .all()
        ]

        if len(months) < 2:
            # Need at least two snapshots to compute trend
            return []

        curr_month, prev_month = months[0], months[1]

        curr_snapshots = {
            s.skill_id: s for s in self.db.query(SkillDemandSnapshot)
            .filter(
                SkillDemandSnapshot.role_id == role_id,
                SkillDemandSnapshot.snapshot_month == curr_month
            ).all()
        }

        prev_snapshots = {
            s.skill_id: s for s in self.db.query(SkillDemandSnapshot)
            .filter(
                SkillDemandSnapshot.role_id == role_id,
                SkillDemandSnapshot.snapshot_month == prev_month
            ).all()
        }

        all_skill_ids = set(curr_snapshots.keys()).union(set(prev_snapshots.keys()))
        trends = []

        for skill_id in all_skill_ids:
            curr_s = curr_snapshots.get(skill_id)
            prev_s = prev_snapshots.get(skill_id)

            curr_demand = curr_s.demand_percentage if curr_s else 0.0
            prev_demand = prev_s.demand_percentage if prev_s else 0.0

            abs_change = round(curr_demand - prev_demand, 2)

            if prev_demand > 0:
                pct_change = round(((curr_demand - prev_demand) / prev_demand) * 100, 2)
            elif curr_demand > 0:
                pct_change = 100.0  # Newly appeared skill
            else:
                pct_change = 0.0

            # Assign trend label
            if pct_change >= self.RISING_FAST_THRESHOLD:
                label = "RISING_FAST"
            elif pct_change >= self.RISING_THRESHOLD:
                label = "RISING"
            elif pct_change <= self.DECLINING_FAST_THRESHOLD:
                label = "DECLINING_FAST"
            elif pct_change <= self.DECLINING_THRESHOLD:
                label = "DECLINING"
            else:
                label = "STABLE"

            # Emerging criteria: high positive velocity and at least present in current period
            curr_jobs = curr_s.job_count if curr_s else 0
            is_emerging = (pct_change >= self.EMERGING_MIN_GROWTH and curr_jobs >= 2 and curr_demand >= 5.0)
            is_declining = (label in ("DECLINING", "DECLINING_FAST"))

            # Save / Update in skill_trends table
            record = self.db.query(SkillTrend).filter(
                SkillTrend.role_id == role_id,
                SkillTrend.skill_id == skill_id
            ).first()

            if record:
                record.previous_demand = prev_demand
                record.current_demand = curr_demand
                record.absolute_change = abs_change
                record.percentage_change = pct_change
                record.trend_label = label
                record.is_emerging = is_emerging
                record.is_declining = is_declining
                record.calculated_at = datetime.now(timezone.utc)
            else:
                record = SkillTrend(
                    role_id=role_id,
                    skill_id=skill_id,
                    previous_demand=prev_demand,
                    current_demand=curr_demand,
                    absolute_change=abs_change,
                    percentage_change=pct_change,
                    trend_label=label,
                    is_emerging=is_emerging,
                    is_declining=is_declining
                )
                self.db.add(record)

            trends.append({
                "skill_id": skill_id,
                "previous_demand": prev_demand,
                "current_demand": curr_demand,
                "absolute_change": abs_change,
                "percentage_change": pct_change,
                "trend_label": label,
                "is_emerging": is_emerging
            })

        self.db.commit()
        return trends

    def calculate_all_trends(self) -> int:
        """Calculates trends for all canonical roles in database."""
        roles = self.db.query(Role).all()
        total_calculated = 0
        for r in roles:
            t = self.calculate_trends_for_role(r.id)
            total_calculated += len(t)
        return total_calculated
