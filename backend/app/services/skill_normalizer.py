import json
import re
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

class SkillNormalizer:
    def __init__(self, skills_path: Path = None):
        if skills_path is None:
            skills_path = DATA_DIR / "skills.json"

        with open(skills_path, "r", encoding="utf-8") as f:
            self.skills_dict = json.load(f)

        # Build alias to canonical mapping
        # Maps lowercase alias string -> (canonical_id, canonical_name, category)
        self.alias_map: Dict[str, Tuple[str, str, str]] = {}
        
        # Precompile regex pattern for exact alias matching
        # Sort aliases by length descending so longer phrases match first (e.g. "machine learning" before "c")
        all_aliases = []

        for skill_id, data in self.skills_dict.items():
            c_name = data["name"]
            cat = data["category"]
            # Add canonical name itself
            self.alias_map[c_name.lower()] = (skill_id, c_name, cat)
            all_aliases.append(c_name.lower())

            for alias in data.get("aliases", []):
                alias_clean = alias.strip().lower()
                self.alias_map[alias_clean] = (skill_id, c_name, cat)
                all_aliases.append(alias_clean)

        self.sorted_aliases = sorted(list(set(all_aliases)), key=lambda x: len(x), reverse=True)

    def normalize(self, raw_mention: str) -> Optional[Tuple[str, str, str]]:
        """
        Takes raw string, returns (canonical_id, canonical_name, category) or None
        """
        cleaned = raw_mention.strip().lower()
        return self.alias_map.get(cleaned)

    def get_canonical_skills(self) -> Dict[str, Any]:
        return self.skills_dict
