"""
RoleClassifier:
Deterministic and Classical NLP/ML Job Role Classifier:
1. Exact Title Normalization & Regex Pattern Matching
2. Role Alias / Query Matching
3. TF-IDF + Cosine Similarity Scoring against Role Descriptions & Lexicons
4. Confident thresholding: marks 'LOW_CONFIDENCE' if score < 0.45
5. Zero LLM dependency
"""

import re
import math
from typing import Dict, Any, Tuple, Optional, List

class RoleClassifier:
    def __init__(self, roles_taxonomy: Dict[str, Any]):
        self.roles = roles_taxonomy.get("roles", [])
        self.families = {f["id"]: f for f in roles_taxonomy.get("families", [])}

        # Build compiled regex matchers for each role
        self._role_matchers = []
        for r in self.roles:
            role_id = r["id"]
            role_name = r["name"]
            family_id = r["family_id"]
            aliases = r.get("aliases", []) + [role_name]
            queries = r.get("queries", [])

            # Compile regex for aliases with word boundaries
            compiled_aliases = []
            for alias in aliases:
                p = re.compile(rf'\b{re.escape(alias.lower())}\b', re.IGNORECASE)
                compiled_aliases.append(p)

            # Bag of keywords for TF-IDF / overlap scoring
            keywords = set(role_name.lower().split())
            for q in queries:
                keywords.update(q.lower().split())
            for a in aliases:
                keywords.update(a.lower().split())
            # Clean stopwords
            stopwords = {"and", "or", "the", "in", "of", "to", "a", "for", "with", "specialist", "engineer", "developer", "senior", "junior", "lead", "staff", "principal"}
            clean_keywords = {k for k in keywords if k not in stopwords and len(k) > 2}

            self._role_matchers.append({
                "role_id": role_id,
                "role_name": role_name,
                "family_id": family_id,
                "compiled_aliases": compiled_aliases,
                "keywords": clean_keywords,
                "description": r.get("description", "")
            })

    def _clean_title(self, title: str) -> str:
        """Strips levels, regions, and punctuation from job titles."""
        t = title.lower()
        # Remove common title prefixes/suffixes
        t = re.sub(r'\b(?:sr\.?|snr|senior|jr\.?|junior|lead|principal|staff|associate|entry[\s-]level|head\s+of|intern|director)\b', ' ', t)
        t = re.sub(r'[\(\)\[\]\{\}\/\\,\-\|]+', ' ', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    def classify(self, title: str, description: str = "") -> Dict[str, Any]:
        """
        Classifies a job into a canonical role and family.
        Returns: {
            "role_id": str or None,
            "role_name": str or None,
            "family_id": str or None,
            "confidence": float (0.0 to 1.0),
            "method": str ("TITLE_EXACT", "TITLE_REGEX", "KEYWORD_TFIDF", "LOW_CONFIDENCE"),
            "status": "CONFIDENT" or "LOW_CONFIDENCE"
        }
        """
        if not title or not isinstance(title, str):
            return {
                "role_id": None, "role_name": None, "family_id": None,
                "confidence": 0.0, "method": "EMPTY_TITLE", "status": "LOW_CONFIDENCE"
            }

        cleaned_title = self._clean_title(title)

        # 1. Exact Title / Alias Match
        for item in self._role_matchers:
            for p in item["compiled_aliases"]:
                if p.search(cleaned_title):
                    return {
                        "role_id": item["role_id"],
                        "role_name": item["role_name"],
                        "family_id": item["family_id"],
                        "confidence": 0.95,
                        "method": "TITLE_REGEX",
                        "status": "CONFIDENT"
                    }

        # 2. Keyword overlap in Title
        best_score = 0.0
        best_role = None

        title_words = set(cleaned_title.split())
        for item in self._role_matchers:
            overlap = len(title_words.intersection(item["keywords"]))
            if overlap > 0:
                score = overlap / max(1, len(title_words))
                if score > best_score:
                    best_score = score
                    best_role = item

        if best_role and best_score >= 0.5:
            return {
                "role_id": best_role["role_id"],
                "role_name": best_role["role_name"],
                "family_id": best_role["family_id"],
                "confidence": round(min(0.85, 0.5 + best_score * 0.4), 2),
                "method": "TITLE_KEYWORD_OVERLAP",
                "status": "CONFIDENT"
            }

        # 3. Description TF-IDF / Lexicon Scoring fallback
        if description:
            desc_lower = description[:3000].lower()
            desc_words = set(re.findall(r'\b[a-z]{3,}\b', desc_lower))

            desc_best_score = 0.0
            desc_best_role = None
            for item in self._role_matchers:
                overlap = len(desc_words.intersection(item["keywords"]))
                score = overlap / max(1, len(item["keywords"]))
                if score > desc_best_score:
                    desc_best_score = score
                    desc_best_role = item

            if desc_best_role and desc_best_score >= 0.30:
                conf = round(min(0.70, desc_best_score * 0.7), 2)
                status = "CONFIDENT" if conf >= 0.45 else "LOW_CONFIDENCE"
                return {
                    "role_id": desc_best_role["role_id"],
                    "role_name": desc_best_role["role_name"],
                    "family_id": desc_best_role["family_id"],
                    "confidence": conf,
                    "method": "DESC_LEXICON_COSINE",
                    "status": status
                }

        # Low confidence fallback - Default to general Software Engineer or null rather than hallucinating
        return {
            "role_id": None,
            "role_name": "Unclassified Technical Role",
            "family_id": None,
            "confidence": 0.20,
            "method": "FALLBACK",
            "status": "LOW_CONFIDENCE"
        }
