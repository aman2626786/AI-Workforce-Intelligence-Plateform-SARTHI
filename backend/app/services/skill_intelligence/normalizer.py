"""
SkillNormalizer:
Normalizes raw extracted skill candidates into canonical platform skills:
1. Exact Canonical Match (case-insensitive)
2. Alias Lookup (decoupled aliases table / local dictionary)
3. Token & Punctuation Normalization (version removal: "python 3.11" -> "Python", "react.js" -> "React")
4. Controlled High-Precision Fuzzy Matching (Levenshtein similarity >= 0.92 with strict length & collision guards)
   - Specifically protects 'Java' != 'JavaScript', 'C' != 'C++', 'R' != any short token.
"""

import re
import difflib
from typing import Optional, Dict, Any, Tuple

class SkillNormalizer:
    def __init__(self, skills_taxonomy: Optional[Dict[str, Any]] = None):
        self._canonical_by_name = {}  # lower_name -> skill_dict
        self._canonical_by_id = {}    # id -> skill_dict
        self._alias_map = {}          # lower_alias -> canonical_id
        self._all_alias_strings = []   # list of alias strings for controlled fuzzy

        # Stoplist of dangerous confusion pairs that MUST NEVER be fuzzy matched
        self._disallowed_fuzzy = {
            "java": {"javascript"},
            "javascript": {"java"},
            "c": {"c++", "c#"},
            "c++": {"c", "c#"},
            "c#": {"c", "c++"},
            "r": {"rust", "ruby", "react"},
            "go": {"golang"},
            "sql": {"nosql", "plsql"},
            "nosql": {"sql"}
        }

        if skills_taxonomy:
            self.load_taxonomy(skills_taxonomy)

    def load_taxonomy(self, skills_taxonomy: Dict[str, Any]):
        """Populates lookup tables from a skills dictionary or database records."""
        self._canonical_by_name.clear()
        self._canonical_by_id.clear()
        self._alias_map.clear()

        skills = skills_taxonomy.get("skills", [])
        for s in skills:
            s_id = s["id"]
            c_name = s["canonical_name"]
            c_name_lower = c_name.lower().strip()

            skill_entry = {
                "id": s_id,
                "canonical_name": c_name,
                "category": s.get("category", "General"),
                "subcategory": s.get("subcategory"),
                "description": s.get("description")
            }

            self._canonical_by_id[s_id] = skill_entry
            self._canonical_by_name[c_name_lower] = skill_entry
            self._alias_map[c_name_lower] = s_id

            # Add all aliases
            for alias in s.get("aliases", []):
                a_lower = alias.lower().strip()
                if a_lower:
                    self._alias_map[a_lower] = s_id

        self._all_alias_strings = list(self._alias_map.keys())

    def _clean_token(self, raw_str: str) -> str:
        """Strips trailing punctuation and standardizes spacing."""
        cleaned = re.sub(r'[\r\n\t]+', ' ', raw_str)
        cleaned = re.sub(r'[^\w\s\+\#\.\/-]', '', cleaned)
        return cleaned.strip()

    def _strip_version_suffixes(self, text: str) -> str:
        """Removes version numbers like '3.10', 'v2', '17' e.g. 'python 3' -> 'python'."""
        # e.g. 'python 3.11' -> 'python'
        res = re.sub(r'\s+v?\d+(?:\.\d+)*\+?$', '', text, flags=re.IGNORECASE)
        # e.g. 'angular 2+' -> 'angular'
        res = re.sub(r'\s+\d+\+?$', '', res)
        return res.strip()

    def normalize(self, raw_candidate: str) -> Tuple[Optional[Dict[str, Any]], float, str]:
        """
        Normalizes a candidate string to its canonical skill definition.
        Returns: (canonical_skill_dict, confidence, match_method)
                 or (None, 0.0, 'UNKNOWN')
        """
        if not raw_candidate or not isinstance(raw_candidate, str):
            return None, 0.0, "EMPTY"

        candidate_clean = self._clean_token(raw_candidate)
        candidate_lower = candidate_clean.lower()

        if not candidate_lower:
            return None, 0.0, "EMPTY"

        # 1. Exact Canonical Match
        if candidate_lower in self._canonical_by_name:
            skill = self._canonical_by_name[candidate_lower]
            return skill, 1.0, "EXACT_CANONICAL"

        # 2. Exact Alias Lookup
        if candidate_lower in self._alias_map:
            skill_id = self._alias_map[candidate_lower]
            skill = self._canonical_by_id[skill_id]
            return skill, 0.98, "EXACT_ALIAS"

        # 3. Version-stripped lookup (e.g. 'Python 3' -> 'Python')
        stripped = self._strip_version_suffixes(candidate_lower)
        if stripped != candidate_lower:
            if stripped in self._canonical_by_name:
                return self._canonical_by_name[stripped], 0.95, "STRIPPED_CANONICAL"
            if stripped in self._alias_map:
                skill_id = self._alias_map[stripped]
                return self._canonical_by_id[skill_id], 0.93, "STRIPPED_ALIAS"

        # 4. Punctuation normalized lookup (e.g. 'React-JS' -> 'reactjs', 'node.js' -> 'nodejs')
        no_punct = re.sub(r'[\.\-\/\s]+', '', candidate_lower)
        for alias, skill_id in self._alias_map.items():
            alias_no_punct = re.sub(r'[\.\-\/\s]+', '', alias)
            if no_punct == alias_no_punct and len(no_punct) >= 3:
                return self._canonical_by_id[skill_id], 0.90, "PUNCTUATION_NORM"

        # 5. Controlled Fuzzy Matching (Only for candidates >= 4 chars, threshold >= 0.92)
        if len(candidate_lower) >= 4:
            # Check length filter to avoid comparing short words with long words
            candidates = [
                a for a in self._all_alias_strings
                if abs(len(a) - len(candidate_lower)) <= 2
            ]
            matches = difflib.get_close_matches(candidate_lower, candidates, n=1, cutoff=0.92)
            if matches:
                best_match = matches[0]
                # Guard against forbidden pairs
                disallowed = self._disallowed_fuzzy.get(candidate_lower, set())
                if best_match not in disallowed:
                    skill_id = self._alias_map[best_match]
                    skill = self._canonical_by_id[skill_id]
                    return skill, 0.85, "CONTROLLED_FUZZY"

        return None, 0.0, "UNKNOWN"
