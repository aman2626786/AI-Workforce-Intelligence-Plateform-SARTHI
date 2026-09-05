from pathlib import Path
from typing import Dict, Any
from backend.app.services.text_extractor import TextExtractor
from backend.app.services.section_detector import SectionDetector
from backend.app.services.profile_extractor import ProfileExtractor
from backend.app.services.skill_extractor import SkillExtractor
from backend.app.services.conflict_detector import ConflictDetector

class ResumeParser:
    def __init__(self):
        self.text_extractor = TextExtractor()
        self.section_detector = SectionDetector()
        self.profile_extractor = ProfileExtractor()
        self.skill_extractor = SkillExtractor()
        self.conflict_detector = ConflictDetector()

    def parse_resume(self, file_path: str | Path, user_profile_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        End-to-end local deterministic resume parsing pipeline.
        No external LLM APIs are used.
        """
        path = Path(file_path)
        
        # 1. Text Extraction & Cleaning
        raw_text = self.text_extractor.extract_text(path)
        if not raw_text or len(raw_text.strip()) < 30:
            raise ValueError("We couldn't extract readable text from this resume. Please upload a text-based PDF or DOCX.")

        # 2. Section Segmentation
        sections = self.section_detector.detect_sections(raw_text)

        # 3. Structured Entity Extraction
        personal_info = self.profile_extractor.extract_personal_info(raw_text, sections.get("PERSONAL", ""))
        education = self.profile_extractor.extract_education(sections.get("EDUCATION", ""))
        experience = self.profile_extractor.extract_experience(sections.get("EXPERIENCE", ""))
        projects = self.profile_extractor.extract_projects(sections.get("PROJECTS", ""))
        certifications = self.profile_extractor.extract_certifications(sections.get("CERTIFICATIONS", ""))

        # 4. Skill Extraction & Normalization
        extracted_skills = self.skill_extractor.extract_all_skills(sections)

        # 5. Enrich projects with skills mentioned in their descriptions & tech stack
        for proj in projects:
            tech_raw_str = proj.get("tech_raw", "")
            proj_text = f"{proj.get('name', '')} {tech_raw_str} {proj.get('description', '')}"
            proj_skills = self.skill_extractor.extract_skills_from_text(proj_text, "PROJECTS", 0.92)
            detected_skills = [ps["canonical_name"] for ps in proj_skills]

            # Also parse and normalize individual terms from tech_raw if present
            if tech_raw_str:
                import re
                raw_parts = [p.strip() for p in re.split(r'[,|/•]', tech_raw_str) if p.strip()]
                for raw_item in raw_parts:
                    norm = self.skill_extractor.normalizer.normalize(raw_item)
                    if norm and norm[1] not in detected_skills:
                        detected_skills.append(norm[1])
                    elif not norm and len(raw_item) >= 2:
                        clean_raw = raw_item.strip()
                        if not any(clean_raw.lower() == s.lower() for s in detected_skills):
                            detected_skills.append(clean_raw)

            proj["technologies"] = detected_skills
            proj.pop("tech_raw", None)

        # 6. User Priority & Conflict Detection
        conflicts = []
        if user_profile_data:
            conflicts = self.conflict_detector.detect_conflicts(
                user_profile_data=user_profile_data,
                resume_extracted_data={
                    "personal_info": personal_info,
                    "education": education
                }
            )

        # 7. Inferred Primary Role & Domain Detection
        role_inference = self.profile_extractor.infer_primary_role(
            skills=extracted_skills,
            raw_text=raw_text
        )

        # 8. Confidence Summary
        confidence_summary = {
            "text_extraction": 0.98,
            "section_detection": 0.95 if len(sections) >= 3 else 0.75,
            "email": personal_info["confidence"]["email"],
            "skills": round(sum(s["confidence"] for s in extracted_skills) / max(1, len(extracted_skills)), 2) if extracted_skills else 0.0,
            "overall": 0.92
        }

        return {
            "parser_version": "1.0.0",
            "raw_text": raw_text,
            "raw_text_length": len(raw_text),
            "sections_detected": list(sections.keys()),
            "personal_info": personal_info,
            "education": education,
            "experience": experience,
            "projects": projects,
            "certifications": certifications,
            "skills": extracted_skills,
            "inferred_domain": role_inference.get("inferred_domain", "Software Engineering"),
            "inferred_target_role": role_inference.get("inferred_target_role", "Software Engineer"),
            "inferred_role_confidence": role_inference.get("confidence", 0.8),
            "conflicts": conflicts,
            "confidence_summary": confidence_summary
        }

