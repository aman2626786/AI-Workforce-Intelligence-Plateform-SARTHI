"""
Profile Intelligence Configuration:
Centralized configurable parameters, scoring weights, relationship compatibility values,
gap priority weights, freshness decay, and diversity constraints.
"""

from typing import Dict, Any

class ProfileIntelligenceConfig:
    # ----------------------------------------------------
    # 1. Job Match Dimensional Weights (Sum = 1.0)
    # ----------------------------------------------------
    SKILL_WEIGHT: float = 0.50
    ROLE_WEIGHT: float = 0.20
    EXPERIENCE_WEIGHT: float = 0.10
    LOCATION_WEIGHT: float = 0.10
    EDUCATION_WEIGHT: float = 0.05
    FRESHNESS_WEIGHT: float = 0.05

    # ----------------------------------------------------
    # 2. Skill Match Sub-Weights
    # ----------------------------------------------------
    REQUIRED_SKILL_WEIGHT: float = 0.75
    PREFERRED_SKILL_WEIGHT: float = 0.25

    # ----------------------------------------------------
    # 3. Related Skill Compatibility Scores
    # ----------------------------------------------------
    SKILL_RELATION_SCORES: Dict[str, float] = {
        "EXACT": 1.0,
        "STRONG_RELATED": 0.80,
        "PARENT": 0.70,
        "CHILD": 0.85,
        "TOOL_OF": 0.75,
        "FRAMEWORK_OF": 0.80,
        "ALTERNATIVE": 0.65,
        "RELATED": 0.50,
        "PREREQUISITE": 0.60,
        "WEAK": 0.20,
        "NONE": 0.0,
    }

    # ----------------------------------------------------
    # 4. Role Compatibility Matrix / Multipliers
    # ----------------------------------------------------
    ROLE_MATCH_EXACT: float = 1.0
    ROLE_MATCH_SAME_FAMILY_CLOSE: float = 0.80  # e.g., Data Analyst vs BI Analyst
    ROLE_MATCH_SAME_FAMILY_DISTANT: float = 0.60 # e.g., Data Analyst vs Data Engineer
    ROLE_MATCH_CROSS_FAMILY_RELEVANT: float = 0.30 # e.g., Data Analyst vs Software Engineer
    ROLE_MATCH_UNRELATED: float = 0.05

    # ----------------------------------------------------
    # 5. Skill Gap Priority Weights (Sum = 1.0)
    # ----------------------------------------------------
    GAP_DEMAND_WEIGHT: float = 0.35
    GAP_REQUIREMENT_WEIGHT: float = 0.25
    GAP_IMPORTANCE_WEIGHT: float = 0.20
    GAP_TREND_WEIGHT: float = 0.10
    GAP_ROLE_RELEVANCE_WEIGHT: float = 0.10

    # Trend Multipliers for Skill Gap
    TREND_MULTIPLIERS: Dict[str, float] = {
        "RISING_FAST": 1.0,
        "RISING": 0.85,
        "STABLE": 0.60,
        "DECLINING": 0.30,
        "DECLINING_FAST": 0.10,
    }

    # Priority Classification Thresholds (0-100)
    GAP_HIGH_PRIORITY_THRESHOLD: float = 65.0
    GAP_MEDIUM_PRIORITY_THRESHOLD: float = 35.0

    # ----------------------------------------------------
    # 6. Freshness Decay Parameters
    # ----------------------------------------------------
    FRESHNESS_DAYS_EXCELLENT: int = 3     # <= 3 days -> 1.0
    FRESHNESS_DAYS_GOOD: int = 7          # <= 7 days -> 0.9
    FRESHNESS_DAYS_MODERATE: int = 14     # <= 14 days -> 0.8
    FRESHNESS_DAYS_ACCEPTABLE: int = 30   # <= 30 days -> 0.6
    FRESHNESS_DAYS_OLD: int = 60          # <= 60 days -> 0.4
    FRESHNESS_MIN_SCORE: float = 0.2

    # ----------------------------------------------------
    # 7. Candidate Retrieval Limits
    # ----------------------------------------------------
    MAX_CANDIDATES_STAGE_1: int = 300
    DEFAULT_RECOMMENDATION_LIMIT: int = 20
    ALLOWED_RECOMMENDATION_LIMITS = [10, 20, 50, 100]

    # ----------------------------------------------------
    # 8. Recommendation Diversity Rules
    # ----------------------------------------------------
    MAX_JOBS_PER_COMPANY: int = 4  # Limit company repetition in top N
    MIN_ROLE_DIVERSITY_COUNT: int = 1 # Allow at least 1 related role if match score >= 70%

    # ----------------------------------------------------
    # 9. Batch Processing
    # ----------------------------------------------------
    BATCH_SIZE: int = 100

config = ProfileIntelligenceConfig()
