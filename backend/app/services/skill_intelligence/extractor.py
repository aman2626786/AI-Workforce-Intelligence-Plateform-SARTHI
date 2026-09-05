"""
SkillExtractor:
Local, Rule-Based, Boundary-Aware NLP Skill Extraction Engine:
- Extracts canonical skills and aliases with character offsets and sentence evidence
- Classifies requirement type: REQUIRED vs PREFERRED vs UNKNOWN
- Uses multi-word phrase prioritization to prevent fragmented matches
- Contextual guards for ambiguous tokens ('R', 'Go', 'C')
- Harvests unknown tech candidates for human-in-the-loop admin review
- 100% LLM-free, local execution
"""

import re
from typing import List, Dict, Any, Tuple, Optional
from backend.app.services.skill_intelligence.text_cleaner import TextCleaner
from backend.app.services.skill_intelligence.section_detector import SectionDetector
from backend.app.services.skill_intelligence.normalizer import SkillNormalizer

class SkillExtractor:
    def __init__(self, normalizer: SkillNormalizer):
        self.cleaner = TextCleaner()
        self.section_detector = SectionDetector()
        self.normalizer = normalizer

        # Prepare regex match patterns sorted by length descending (longest match first)
        self._compiled_patterns: List[Tuple[str, str, re.Pattern, bool]] = []
        self._init_patterns()

        # Context guards for tricky short words
        self._r_guard = re.compile(r'\b(?:r\s+(?:programming|language|scripting|studio)|r\s*[/,]\s*(?:python|sas|sql|matlab)|(?:python|sas|sql|matlab)\s*[/,]\s*r)\b', re.IGNORECASE)
        self._go_guard = re.compile(r'\b(?:golang|go\s+(?:language|programming|developer)|(?:python|java|rust|c\+\+)\s*[/,]\s*go|go\s*[/,]\s*(?:python|java|rust))\b', re.IGNORECASE)
        self._c_guard = re.compile(r'\b(?:c\s*[/,]\s*c\+\+|c\+\+\s*[/,]\s*c|c\s+(?:programming|language))\b', re.IGNORECASE)

    def _init_patterns(self):
        """Builds boundary-aware regex patterns from all aliases in normalizer."""
        # Collect (alias, skill_id)
        aliases = []
        for alias, s_id in self.normalizer._alias_map.items():
            aliases.append((alias, s_id))

        # Sort longest phrase first
        aliases.sort(key=lambda x: len(x[0]), reverse=True)

        for alias, s_id in aliases:
            # Special treatment for tokens containing special characters
            escaped = re.escape(alias)
            # If alias starts/ends with alphanumeric, enforce word boundary \b
            prefix = r'\b' if alias[0].isalnum() else r'(?:^|[\s,;:\(\)\[\]])'
            suffix = r'\b' if alias[-1].isalnum() else r'(?:$|[\s,;:\(\)\[\]])'

            # Flag ambiguous single/two letter tokens
            is_ambiguous = alias.lower() in {"r", "go", "c"}

            try:
                pat = re.compile(rf'{prefix}{escaped}{suffix}', re.IGNORECASE)
                self._compiled_patterns.append((alias, s_id, pat, is_ambiguous))
            except Exception:
                pass

    def _validate_ambiguous_context(self, alias_lower: str, sentence: str) -> bool:
        """Ensures single/two letter words are actual tech skills, not common English."""
        if alias_lower == "r":
            return bool(self._r_guard.search(sentence))
        elif alias_lower == "go":
            return bool(self._go_guard.search(sentence))
        elif alias_lower == "c":
            return bool(self._c_guard.search(sentence))
        return True

    def extract_skills_from_jd(self, jd_text: str) -> Dict[str, Any]:
        """
        Full pipeline for a single Job Description:
        1. Clean text
        2. Detect sections
        3. Extract canonical skills with spans and evidence
        4. Detect potential unknown candidates
        Returns: {
            "skills": List[Dict],
            "unknown_candidates": List[Dict],
            "cleaned_text": str
        }
        """
        cleaned_text = self.cleaner.clean(jd_text)
        if not cleaned_text:
            return {"skills": [], "unknown_candidates": [], "cleaned_text": ""}

        sections = self.section_detector.detect_sections(cleaned_text)
        extracted_skills = {}  # skill_id -> skill_record (deduplicating per job, keeping highest requirement priority)

        # Track spans already covered to prevent sub-string collision (e.g. 'Power' within 'Power BI')
        matched_spans = []

        for sec in sections:
            sec_name = sec["section"]
            sec_text = sec["text"]
            sec_start = sec["start_pos"]

            # Process sentence by sentence for fine-grained evidence and boundary offsets
            for sentence, sent_start, sent_end in self.cleaner.extract_sentences_with_spans(sec_text):
                abs_sent_start = sec_start + sent_start

                # Match patterns
                for alias, skill_id, pattern, is_ambiguous in self._compiled_patterns:
                    alias_lower = alias.lower()

                    for m in pattern.finditer(sentence):
                        span_start = abs_sent_start + m.start()
                        span_end = abs_sent_start + m.end()

                        # Check collision with already matched longer span
                        collision = any(
                            (span_start >= exist_s and span_end <= exist_e) or
                            (span_start < exist_e and span_end > exist_s)
                            for exist_s, exist_e in matched_spans
                        )
                        if collision:
                            continue

                        # Ambiguity guard
                        if is_ambiguous and not self._validate_ambiguous_context(alias_lower, sentence):
                            continue

                        matched_text = m.group(0).strip()
                        matched_spans.append((span_start, span_end))

                        # Classify requirement type
                        req_type = self.section_detector.classify_requirement_type(sec_name, sentence)

                        canonical_skill = self.normalizer._canonical_by_id.get(skill_id)
                        if not canonical_skill:
                            continue

                        # Requirement type priority: REQUIRED > PREFERRED > UNKNOWN
                        if skill_id in extracted_skills:
                            prev_req = extracted_skills[skill_id]["requirement_type"]
                            if prev_req != "REQUIRED" and req_type == "REQUIRED":
                                extracted_skills[skill_id]["requirement_type"] = "REQUIRED"
                                extracted_skills[skill_id]["evidence_text"] = sentence
                                extracted_skills[skill_id]["section"] = sec_name
                        else:
                            extracted_skills[skill_id] = {
                                "skill_id": skill_id,
                                "canonical_name": canonical_skill["canonical_name"],
                                "category": canonical_skill["category"],
                                "matched_text": matched_text,
                                "requirement_type": req_type,
                                "evidence_text": sentence,
                                "section": sec_name,
                                "start_pos": span_start,
                                "end_pos": span_end,
                                "confidence": 1.0 if not is_ambiguous else 0.90
                            }

        # Scan for unknown tech candidates (e.g. uppercase acronyms or PascalCase technical terms not matched)
        unknown_candidates = self._detect_unknown_candidates(cleaned_text, matched_spans)

        return {
            "skills": list(extracted_skills.values()),
            "unknown_candidates": unknown_candidates,
            "cleaned_text": cleaned_text
        }

    def _detect_unknown_candidates(self, text: str, matched_spans: List[Tuple[int, int]]) -> List[Dict[str, Any]]:
        """Harvests potential unknown skills for human review."""
        candidates = {}
        # Match standalone uppercase acronyms (3 to 6 letters) or tech patterns like 'dbt', 'GraphQL'
        pattern = re.compile(r'\b(?:[A-Z]{2,6}|[A-Z][a-z0-9]+[A-Z][a-zA-Z0-9]*|dbt|wasm)\b')

        # Ignore common non-skill acronyms
        ignore_list = {
            "AND", "FOR", "THE", "WITH", "YOU", "OUR", "ARE", "NOT", "ALL", "NEW",
            "ANY", "CAN", "GET", "JOB", "ROLE", "TEAM", "WORK", "FULL", "TIME",
            "YEAR", "YEARS", "PLUS", "MUST", "HAVE", "GOOD", "HIGH", "DATA", "TECH",
            "BEST", "ABLE", "JOIN", "HELP", "WELL", "MAKE", "TAKE", "SEND", "USER",
            "DAYS", "WEEK", "PAID", "LIFE", "TRUE", "OPEN", "FAST", "SAFE", "DEAL",
            "INFO", "NOTE", "TODO", "HTML", "HTTP", "HTTPS", "JSON", "REST", "CRUD",
            "BTECH", "MCA", "BSC", "MSC", "DEGREE", "SALARY", "COMPANY", "EXPERIENCE"
        }

        for m in pattern.finditer(text):
            word = m.group(0).strip()
            w_upper = word.upper()
            if w_upper in ignore_list or len(word) < 2:
                continue

            start, end = m.span()
            if any(start >= s and end <= e for s, e in matched_spans):
                continue

            # Check if normalizer recognizes it
            skill, _, _ = self.normalizer.normalize(word)
            if not skill:
                if word not in candidates:
                    candidates[word] = {
                        "raw_name": word,
                        "frequency": 1,
                        "confidence": 0.65
                    }
                else:
                    candidates[word]["frequency"] += 1

        return list(candidates.values())
