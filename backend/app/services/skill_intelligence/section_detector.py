"""
SectionDetector:
Detects and classifies structural sections within Job Descriptions:
- REQUIRED (Requirements, Must-Have, Basic Qualifications, Technical Skills)
- PREFERRED (Preferred, Nice-to-Have, Bonus, Desired, Plus)
- RESPONSIBILITIES (Responsibilities, Duties, What you will do)
- ABOUT (About Us, Company Overview)
- GENERAL / UNKNOWN (Default context)
"""

import re
from typing import List, Dict, Any

class SectionDetector:
    def __init__(self):
        # Section header patterns
        self._section_patterns = {
            "REQUIRED": [
                r'^(?:technical\s+)?requirements(?:\s*:)?$',
                r'^(?:required|must[\s-]have)\s*(?:skills|qualifications|requirements|competencies)?(?:\s*:)?$',
                r'^(?:basic|minimum)\s+(?:qualifications|requirements)(?:\s*:)?$',
                r'^what\s+(?:you(?:\'ll)?\s+)?(?:need|bring)(?:\s*:)?$',
                r'^qualifications(?:\s*:)?$',
                r'^skills\s+(?:and\s+qualifications|required)(?:\s*:)?$',
                r'^essential\s+(?:skills|qualifications|requirements)(?:\s*:)?$',
                r'^who\s+you\s+are(?:\s*:)?$'
            ],
            "PREFERRED": [
                r'^(?:preferred|nice[\s-]to[\s-]have|bonus|good[\s-]to[\s-]have)\s*(?:skills|qualifications|requirements)?(?:\s*:)?$',
                r'^(?:desired|additional|optional)\s+(?:skills|qualifications|requirements)?(?:\s*:)?$',
                r'^(?:it(?:\'s)?\s+a\s+)?plus(?:\s*:)?$',
                r'^what\s+will\s+make\s+you\s+stand\s+out(?:\s*:)?$',
                r'^what\s+gives\s+you\s+an\s+edge(?:\s*:)?$',
                r'^great\s+to\s+have(?:\s*:)?$'
            ],
            "RESPONSIBILITIES": [
                r'^(?:key\s+)?responsibilities(?:\s*:)?$',
                r'^(?:duties|accountabilities)(?:\s*:)?$',
                r'^what\s+you(?:\'ll)?\s+(?:do|be\s+doing)(?:\s*:)?$',
                r'^the\s+role(?:\s*:)?$',
                r'^job\s+summary(?:\s*:)?$',
                r'^role\s+overview(?:\s*:)?$'
            ],
            "ABOUT": [
                r'^about\s+(?:us|the\s+company|our\s+team)(?:\s*:)?$',
                r'^who\s+we\s+are(?:\s*:)?$',
                r'^company\s+description(?:\s*:)?$'
            ],
            "BENEFITS": [
                r'^(?:benefits|perks|what\s+we\s+offer)(?:\s*:)?$',
                r'^compensation\s+(?:and\s+benefits)?(?:\s*:)?$'
            ]
        }

        # Compiled heading regex
        self._compiled_patterns = {}
        for sec_type, pats in self._section_patterns.items():
            self._compiled_patterns[sec_type] = [
                re.compile(p, re.IGNORECASE) for p in pats
            ]

        # Inline indicator patterns inside sentences (e.g. "Experience with AWS is a plus")
        self._inline_preferred = re.compile(
            r'\b(?:is\s+a\s+plus|nice\s+to\s+have|preferred|optional|bonus|advantageous|good\s+to\s+have|desired)\b',
            re.IGNORECASE
        )
        self._inline_required = re.compile(
            r'\b(?:must\s+have|required|essential|mandatory|strong\s+experience\s+with|minimum\s+of|\d+\+?\s+years?\s+of\s+experience)\b',
            re.IGNORECASE
        )

    def detect_sections(self, text: str) -> List[Dict[str, Any]]:
        """
        Parses text into a sequence of classified sections.
        Returns a list of dicts: [{'section': 'REQUIRED', 'text': '...', 'start_pos': 0, 'end_pos': 120}]
        """
        lines = text.split('\n')
        sections = []
        current_section = "GENERAL"
        current_lines = []
        current_start = 0
        char_cursor = 0

        for line in lines:
            line_str = line.strip()
            line_len = len(line) + 1  # newline

            matched_sec = None
            if len(line_str) <= 60 and not line_str.endswith('.'):
                for sec_type, patterns in self._compiled_patterns.items():
                    if any(p.match(line_str) for p in patterns):
                        matched_sec = sec_type
                        break

            if matched_sec:
                # Flush previous section
                if current_lines:
                    sec_text = '\n'.join(current_lines).strip()
                    if sec_text:
                        sections.append({
                            "section": current_section,
                            "text": sec_text,
                            "start_pos": current_start,
                            "end_pos": char_cursor
                        })
                current_section = matched_sec
                current_lines = []
                current_start = char_cursor
            else:
                current_lines.append(line)

            char_cursor += line_len

        # Flush final section
        if current_lines:
            sec_text = '\n'.join(current_lines).strip()
            if sec_text:
                sections.append({
                    "section": current_section,
                    "text": sec_text,
                    "start_pos": current_start,
                    "end_pos": char_cursor
                })

        if not sections and text.strip():
            sections.append({
                "section": "GENERAL",
                "text": text.strip(),
                "start_pos": 0,
                "end_pos": len(text)
            })

        return sections

    def classify_requirement_type(self, section_name: str, sentence_text: str) -> str:
        """
        Determines whether a skill occurrence is REQUIRED, PREFERRED, or UNKNOWN.
        Sentence-level hints override broad section names when present.
        """
        sentence_lower = sentence_text.lower()

        # 1. Inline sentence checks
        if self._inline_preferred.search(sentence_lower):
            return "PREFERRED"
        if self._inline_required.search(sentence_lower):
            return "REQUIRED"

        # 2. Inherit from section context
        if section_name == "REQUIRED":
            return "REQUIRED"
        elif section_name == "PREFERRED":
            return "PREFERRED"
        elif section_name == "RESPONSIBILITIES":
            return "REQUIRED"  # Skills mentioned in active responsibilities are usually core requirements
        else:
            return "UNKNOWN"
