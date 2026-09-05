import json
import re
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "job_roles.json"

class RoleClassifier:
    """
    Normalizes raw, noisy job titles (e.g. 'Senior ML Engineer II - Remote')
    into canonical roles defined in job_roles.json.
    """

    def __init__(self, config_path: Optional[Path] = None):
        path = config_path or DATA_FILE
        self.roles_data: Dict[str, Any] = {}
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                self.roles_data = json.load(f).get("roles", {})
        
        # Precompute lookup tokens and alias maps
        self.alias_to_canonical: Dict[str, str] = {}
        for role_key, role_info in self.roles_data.items():
            canonical = role_info["canonical_name"]
            for alias in role_info.get("aliases", []):
                self.alias_to_canonical[alias.strip().lower()] = canonical
            for query in role_info.get("queries", []):
                self.alias_to_canonical[query.strip().lower()] = canonical

        # Pre-compile seniority/noise regex to strip
        self.noise_regex = re.compile(
            r'\b(senior|sr\.?|junior|jr\.?|associate|lead|principal|staff|executive|director|head of|intern|internship|fresher|entry[- ]level|ii|iii|iv|v|1|2|3|remote|hybrid|wfh)\b',
            re.IGNORECASE
        )

    def clean_title(self, raw_title: str) -> str:
        if not raw_title:
            return ""
        # Remove parenthetical / bracket info e.g. "(Remote)", "[Immediate Joiner]"
        cleaned = re.sub(r'[\(\[\{].*?[\)\]\}]', '', raw_title)
        # Remove punctuation except hyphens/slashes
        cleaned = re.sub(r'[^a-zA-Z0-9\s\-/]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def classify_role(self, raw_title: str, description: str = "") -> Tuple[str, float]:
        """
        Returns (canonical_role, confidence).
        Falls back to cleaned title if no canonical match found.
        """
        cleaned = self.clean_title(raw_title).lower()
        if not cleaned:
            return "General Technical Role", 0.3

        # 1. Exact alias match
        if cleaned in self.alias_to_canonical:
            return self.alias_to_canonical[cleaned], 1.0

        # 2. Match after removing seniority/noise words
        stripped = self.noise_regex.sub('', cleaned).strip()
        stripped = re.sub(r'\s+', ' ', stripped)
        if stripped in self.alias_to_canonical:
            return self.alias_to_canonical[stripped], 0.95

        # 3. Substring / Token matching against canonical definitions
        best_match = None
        best_score = 0.0

        for alias, canonical in self.alias_to_canonical.items():
            pattern = rf'\b{re.escape(alias)}\b'
            if re.search(pattern, cleaned):
                score = len(alias) / max(len(cleaned), 1)
                if score > best_score:
                    best_score = score
                    best_match = canonical

        if best_match and best_score >= 0.3:
            return best_match, min(0.9, 0.7 + best_score * 0.2)

        # 4. Contextual scan from description if title is generic (e.g. "Software Engineer")
        if "data" in cleaned and "analyst" in cleaned:
            return "Data Analyst", 0.85
        if "data" in cleaned and "scien" in cleaned:
            return "Data Scientist", 0.85
        if "machine learning" in cleaned or "ml" in cleaned:
            return "Machine Learning Engineer", 0.85
        if "ai" in cleaned or "artificial intelligence" in cleaned:
            return "AI Engineer", 0.85
        if "cloud" in cleaned or "aws" in cleaned or "azure" in cleaned:
            return "Cloud Engineer", 0.8
        if "devops" in cleaned or "sre" in cleaned:
            return "DevOps Engineer", 0.85
        if "security" in cleaned or "cyber" in cleaned:
            return "Cybersecurity Analyst", 0.85
        if "full stack" in cleaned or "fullstack" in cleaned:
            return "Full Stack Developer", 0.85
        if "backend" in cleaned:
            return "Backend Developer", 0.85
        if "frontend" in cleaned or "web" in cleaned or "ui" in cleaned:
            return "Frontend Developer", 0.85

        # Fallback: capitalize cleaned title
        fallback = raw_title.strip() if len(raw_title.strip()) <= 50 else "Software Engineer"
        return fallback, 0.5

    # Alias for API compatibility
    classify = classify_role
