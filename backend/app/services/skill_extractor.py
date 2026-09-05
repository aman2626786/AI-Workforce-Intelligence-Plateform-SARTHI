import re
from typing import Dict, List, Any
from backend.app.services.skill_normalizer import SkillNormalizer

class SkillExtractor:
    def __init__(self, normalizer: SkillNormalizer = None):
        self.normalizer = normalizer or SkillNormalizer()

    def extract_skills_from_text(self, text: str, section_name: str, base_confidence: float = 0.95) -> List[Dict[str, Any]]:
        """
        Scans a text block against sorted aliases with word-boundary awareness.
        """
        if not text:
            return []

        found_skills = {}
        # Pre-process text to add spaces around punctuation to avoid word collision
        padded_text = " " + text.replace(",", " , ").replace("/", " / ").replace("|", " | ") + " "

        for alias in self.normalizer.sorted_aliases:
            # Word boundary regex:
            # Special case for languages with symbols like C++, C#, .NET
            if alias in ["c++", "cpp"]:
                pattern = r'(?<!\w)c\+\+(?!\w)|(?<!\w)cpp(?!\w)'
            elif alias == "c":
                pattern = r'(?<!\w)[Cc](?=\s*[,/|]|\s+programming|\s+language)'
            elif alias in ["r", "r language"]:
                pattern = r'(?<!\w)[Rr](?=\s*[,/|]|\s+programming|\s+language|\s+studio)'
            elif alias == ".net":
                pattern = r'(?<!\w)\.net(?!\w)'
            else:
                escaped = re.escape(alias)
                pattern = rf'(?<![A-Za-z0-9_-]){escaped}(?![A-Za-z0-9_-])'

            match = re.search(pattern, padded_text, re.IGNORECASE)
            if match:
                matched_str = match.group(0)
                norm_res = self.normalizer.normalize(alias)
                if norm_res:
                    skill_id, canonical_name, category = norm_res
                    if skill_id not in found_skills:
                        # Extract 60-char sentence context snippet for evidence
                        start_idx = max(0, match.start() - 30)
                        end_idx = min(len(padded_text), match.end() + 30)
                        snippet = padded_text[start_idx:end_idx].strip()

                        found_skills[skill_id] = {
                            "skill_id": skill_id,
                            "canonical_name": canonical_name,
                            "category": category,
                            "original_text": matched_str.strip(),
                            "source_section": section_name,
                            "evidence_text": snippet,
                            "confidence": base_confidence,
                            "confirmed": True
                        }

        return list(found_skills.values())

    def extract_all_skills(self, sections: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Section-aware extraction with differential confidence weights:
        - SKILLS section: 0.98
        - PROJECTS section: 0.92
        - EXPERIENCE section: 0.90
        - CERTIFICATIONS section: 0.85
        - SUMMARY/COURSEWORK: 0.80
        """
        all_skills_map: Dict[str, Dict[str, Any]] = {}

        section_configs = [
            ("SKILLS", 0.98),
            ("PROJECTS", 0.92),
            ("EXPERIENCE", 0.90),
            ("CERTIFICATIONS", 0.85),
            ("COURSEWORK", 0.82),
            ("SUMMARY", 0.80),
        ]

        for sec_name, conf in section_configs:
            sec_text = sections.get(sec_name, "")
            if sec_text:
                extracted = self.extract_skills_from_text(sec_text, sec_name, conf)
                for item in extracted:
                    sid = item["skill_id"]
                    # If already present, keep the higher confidence entry or append evidence
                    if sid not in all_skills_map or all_skills_map[sid]["confidence"] < item["confidence"]:
                        all_skills_map[sid] = item

        # Return sorted by category then name
        return sorted(list(all_skills_map.values()), key=lambda x: (x["category"], x["canonical_name"]))
