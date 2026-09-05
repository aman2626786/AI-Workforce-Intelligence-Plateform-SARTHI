"""
Skill Gap Engine:
Computes personalized skill gaps between student profile skills and target role industry demands:
- Analyzes canonical industry demands (RoleSkillDemand) and trend velocities (SkillTrend)
- Evaluates ontology skill relationships (SkillRelationship) for partial matches
- Classifies skills into MATCHED, PARTIAL, MISSING, LOW_CONFIDENCE
- Calculates configurable 0-100 normalized priority score
- Assigns priority tiers: HIGH, MEDIUM, LOW
- Computes overall student Career Fit score against the target role
"""

from typing import Dict, Any, List, Optional, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.intelligence import RoleSkillDemand, SkillTrend
from backend.app.models.skill import Skill, SkillRelationship
from backend.app.services.profile_intelligence.config import config
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class SkillGapEngine:
    def __init__(self, db: Session):
        self.db = db

    def analyze_gaps(self, student: StudentRepresentation) -> Dict[str, Any]:
        """
        Executes skill gap analysis for a student against their target role.
        Returns:
            {
                "career_fit_score": float (0-100),
                "matched_count": int,
                "partial_count": int,
                "missing_count": int,
                "skill_gaps": List[Dict],
                "matched_skills": List[Dict],
                "top_missing_skills": List[Dict]
            }
        """
        if not student.target_role_id:
            return {
                "career_fit_score": 0.0,
                "matched_count": 0,
                "partial_count": 0,
                "missing_count": 0,
                "skill_gaps": [],
                "matched_skills": [],
                "top_missing_skills": []
            }

        # 1. Fetch industry skill demands for student's target role
        demands = (
            self.db.query(RoleSkillDemand)
            .filter(RoleSkillDemand.role_id == student.target_role_id)
            .order_by(desc(RoleSkillDemand.demand_percentage))
            .all()
        )

        # 2. Fetch skill trends for target role
        trends_map = {
            t.skill_id: t for t in self.db.query(SkillTrend)
            .filter(SkillTrend.role_id == student.target_role_id)
            .all()
        }

        # 3. Preload all skill ontology relationships for fast in-memory lookup
        # (source_skill_id, target_skill_id) -> relation_type
        relationships = self.db.query(SkillRelationship).all()
        rel_map: Dict[Tuple[str, str], Tuple[str, float]] = {}
        for r in relationships:
            rel_map[(r.source_skill_id, r.target_skill_id)] = (r.relation_type, r.confidence)

        student_skill_ids = student.skill_ids
        student_skills_data = student.skills

        skill_gaps = []
        matched_skills = []
        missing_skills = []

        total_demand_weight = 0.0
        acquired_demand_weight = 0.0

        for d in demands:
            skill_id = d.skill_id
            demand_pct = float(d.demand_percentage or 0.0)
            importance = float(d.importance_score or 0.0)
            trend_record = trends_map.get(skill_id)
            trend_label = trend_record.trend_label if trend_record else "STABLE"
            is_emerging = trend_record.is_emerging if trend_record else False

            # Determine requirement type
            req_type = "REQUIRED" if (d.required_count or 0) > (d.preferred_count or 0) else "PREFERRED"
            if (d.required_count or 0) == 0 and (d.preferred_count or 0) == 0:
                req_type = "GENERAL"

            # Check matching status against student's skills
            status = "MISSING"
            student_conf = 0.0
            evidence_note = None
            match_factor = 0.0

            if skill_id in student_skill_ids:
                st_skill = student_skills_data[skill_id]
                student_conf = st_skill.get("confidence", 1.0)
                st_status = st_skill.get("status", "KNOWN")

                if st_status == "LOW_CONFIDENCE" or student_conf < 0.6:
                    status = "LOW_CONFIDENCE"
                    match_factor = 0.6
                    evidence_note = f"Direct match with low confidence ({student_conf:.2f})"
                else:
                    status = "MATCHED"
                    match_factor = 1.0
                    evidence_note = f"Direct match ({st_skill.get('source', 'resume')})"
            else:
                # Check for partial match via ontology relations
                best_rel_score = 0.0
                best_rel_name = None
                best_source_skill = None

                for st_id in student_skill_ids:
                    # Check if student skill is related to demanded skill
                    if (st_id, skill_id) in rel_map:
                        rel_type, rel_conf = rel_map[(st_id, skill_id)]
                        score = config.SKILL_RELATION_SCORES.get(rel_type, 0.5) * rel_conf
                        if score > best_rel_score:
                            best_rel_score = score
                            best_rel_name = rel_type
                            best_source_skill = student_skills_data[st_id].get("canonical_name", st_id)

                    # Reverse relation check (e.g. child -> parent)
                    elif (skill_id, st_id) in rel_map:
                        rel_type, rel_conf = rel_map[(skill_id, st_id)]
                        score = config.SKILL_RELATION_SCORES.get(rel_type, 0.5) * rel_conf
                        if score > best_rel_score:
                            best_rel_score = score
                            best_rel_name = f"INVERSE_{rel_type}"
                            best_source_skill = student_skills_data[st_id].get("canonical_name", st_id)

                if best_rel_score >= 0.5:
                    status = "PARTIAL"
                    match_factor = best_rel_score
                    evidence_note = f"Related to {best_source_skill} ({best_rel_name})"

            # Calculate gap priority score (higher = more urgent to acquire)
            priority_score, priority_level = self._calculate_gap_priority(
                status=status,
                demand_pct=demand_pct,
                req_type=req_type,
                importance=importance,
                trend_label=trend_label,
                is_emerging=is_emerging
            )

            # Cumulative career fit calculation
            weight = demand_pct * (1.5 if req_type == "REQUIRED" else 1.0)
            total_demand_weight += weight
            acquired_demand_weight += (weight * match_factor)

            skill_entry = {
                "skill_id": skill_id,
                "canonical_name": d.skill.canonical_name if d.skill else skill_id,
                "category": d.skill.category if d.skill else "General",
                "status": status,
                "priority_level": priority_level,
                "priority_score": priority_score,
                "demand_percentage": demand_pct,
                "importance_score": importance,
                "trend_label": trend_label,
                "is_emerging": is_emerging,
                "requirement_type": req_type,
                "student_confidence": student_conf,
                "matching_evidence": evidence_note,
            }

            skill_gaps.append(skill_entry)

            if status in ("MATCHED", "PARTIAL", "LOW_CONFIDENCE"):
                matched_skills.append(skill_entry)
            else:
                missing_skills.append(skill_entry)

        # Career fit score between 0 and 100
        career_fit_score = round((acquired_demand_weight / max(1.0, total_demand_weight) * 100), 1)
        # Cap score between 0 and 100
        career_fit_score = min(100.0, max(0.0, career_fit_score))

        # Sort skill gaps by priority_score descending
        skill_gaps.sort(key=lambda x: x["priority_score"], reverse=True)
        missing_skills.sort(key=lambda x: x["priority_score"], reverse=True)

        return {
            "career_fit_score": career_fit_score,
            "matched_count": len([s for s in skill_gaps if s["status"] == "MATCHED"]),
            "partial_count": len([s for s in skill_gaps if s["status"] == "PARTIAL"]),
            "missing_count": len(missing_skills),
            "skill_gaps": skill_gaps,
            "matched_skills": matched_skills,
            "top_missing_skills": missing_skills[:10]
        }

    def _calculate_gap_priority(
        self,
        status: str,
        demand_pct: float,
        req_type: str,
        importance: float,
        trend_label: str,
        is_emerging: bool
    ) -> Tuple[float, str]:
        """
        Calculates a deterministic 0-100 priority score for learning/acquiring a missing skill.
        If already MATCHED, priority score is 0.
        """
        if status == "MATCHED":
            return 0.0, "LOW"

        # 1. Demand component (0 to 100 scaled)
        demand_comp = min(100.0, demand_pct)

        # 2. Requirement component
        req_comp = 100.0 if req_type == "REQUIRED" else (60.0 if req_type == "PREFERRED" else 40.0)

        # 3. Importance score component (0 to 2 scaled to 0-100)
        imp_comp = min(100.0, importance * 50.0)

        # 4. Trend momentum component
        trend_mult = config.TREND_MULTIPLIERS.get(trend_label, 0.6)
        if is_emerging:
            trend_mult = max(trend_mult, 0.95)
        trend_comp = trend_mult * 100.0

        # 5. Role relevance (high base for target role)
        role_comp = 90.0

        # Composite raw score
        raw_score = (
            demand_comp * config.GAP_DEMAND_WEIGHT +
            req_comp * config.GAP_REQUIREMENT_WEIGHT +
            imp_comp * config.GAP_IMPORTANCE_WEIGHT +
            trend_comp * config.GAP_TREND_WEIGHT +
            role_comp * config.GAP_ROLE_RELEVANCE_WEIGHT
        )

        # Partial match discount (reduce urgency by 40% if student has a related skill)
        if status == "PARTIAL":
            raw_score *= 0.6
        elif status == "LOW_CONFIDENCE":
            raw_score *= 0.85

        score = round(min(100.0, max(0.0, raw_score)), 1)

        # Priority level classification
        if score >= config.GAP_HIGH_PRIORITY_THRESHOLD:
            priority_level = "HIGH"
        elif score >= config.GAP_MEDIUM_PRIORITY_THRESHOLD:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        return score, priority_level
