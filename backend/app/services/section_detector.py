import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

class SectionDetector:
    def __init__(self, aliases_path: Path = None):
        if aliases_path is None:
            aliases_path = DATA_DIR / "section_aliases.json"
        
        with open(aliases_path, "r", encoding="utf-8") as f:
            self.aliases_dict = json.load(f)
            
        # Precompute lookup: normalized alias -> canonical key
        self.alias_to_canonical = {}
        for canonical, alias_list in self.aliases_dict.items():
            for alias in alias_list:
                self.alias_to_canonical[alias.strip().lower()] = canonical

    def is_potential_heading(self, line: str) -> Tuple[bool, str]:
        """
        Determines if a line is a section heading using deterministic patterns.
        Returns (is_heading, canonical_section_name)
        """
        cleaned = line.strip()
        if not cleaned or len(cleaned) > 50:
            return False, ""

        # Remove leading/trailing symbols like '---', '===', '•', ':', etc.
        normalized = re.sub(r'^[#\-=_*\s:|]+|[#\-=_*\s:|]+$', '', cleaned).strip().lower()
        if not normalized:
            return False, ""

        # Headings do not end with periods or semicolons
        if cleaned.endswith('.') or cleaned.endswith(';'):
            return False, ""

        # Direct exact match with known aliases
        if normalized in self.alias_to_canonical:
            return True, self.alias_to_canonical[normalized]

        # Check regex match for combined headings (e.g., "Technical Skills & Tools")
        for alias, canonical in self.alias_to_canonical.items():
            pattern = rf'^{re.escape(alias)}$'
            if re.match(pattern, normalized, re.IGNORECASE):
                return True, canonical

        # Check if line is a short heading that starts with alias followed only by valid connectors
        ALLOWED_HEADING_CONNECTORS = {
            '&', 'and', '/', 'summary', 'history', 'details', 'profile',
            'background', 'overview', 'internships', 'training', 'timeline',
            'records', 'competencies', 'experience', 'projects', 'skills'
        }
        for alias, canonical in self.alias_to_canonical.items():
            if len(alias) >= 4 and normalized.startswith(f"{alias} "):
                remainder = normalized[len(alias):].strip()
                rem_words = remainder.split()
                # Must be very short (1-3 words max) and contain only heading words, not sentences
                if 1 <= len(rem_words) <= 3 and all(w in ALLOWED_HEADING_CONNECTORS or w in self.alias_to_canonical for w in rem_words):
                    return True, canonical

        return False, ""

    def detect_sections(self, raw_text: str) -> Dict[str, str]:
        """
        Segments raw text into canonical section blocks.
        """
        lines = raw_text.split("\n")
        sections: Dict[str, List[str]] = {
            "PERSONAL": [],
            "SUMMARY": [],
            "EDUCATION": [],
            "SKILLS": [],
            "EXPERIENCE": [],
            "PROJECTS": [],
            "CERTIFICATIONS": [],
            "ACHIEVEMENTS": [],
            "COURSEWORK": [],
            "LANGUAGES": [],
            "OTHER": []
        }

        current_section = "PERSONAL"

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            is_heading, canonical = self.is_potential_heading(line_str)
            if is_heading:
                current_section = canonical
                continue

            sections[current_section].append(line_str)

        # Convert list of lines to strings
        result = {sec: "\n".join(lines).strip() for sec, lines in sections.items() if lines}
        return result
