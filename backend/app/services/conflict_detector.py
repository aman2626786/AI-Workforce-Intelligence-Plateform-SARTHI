from typing import Dict, Any, List

class ConflictDetector:
    @staticmethod
    def detect_conflicts(user_profile_data: Dict[str, Any], resume_extracted_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Compares student-entered basic profile against resume-extracted data.
        Guarantees Student Input > Resume Data.
        Flags any discrepancies without silent overwriting.
        """
        conflicts = []

        fields_to_check = [
            ("city", "Current City"),
            ("degree", "Degree"),
            ("college", "College / University"),
            ("graduation_year", "Graduation Year"),
        ]

        resume_personal = resume_extracted_data.get("personal_info", {})
        resume_education = resume_extracted_data.get("education", [])
        primary_resume_edu = resume_education[0] if resume_education else {}

        # 1. Check City
        user_city = user_profile_data.get("city")
        resume_city = resume_personal.get("city")
        if user_city and resume_city and user_city.strip().lower() != resume_city.strip().lower():
            conflicts.append({
                "field_name": "Current City",
                "user_value": str(user_city),
                "resume_value": str(resume_city),
                "resolution": "preserved_user_input",
                "explanation": f"You specified '{user_city}' in your profile, while your resume mentions '{resume_city}'. Your input is preserved."
            })

        # 2. Check Degree
        user_degree = user_profile_data.get("degree")
        resume_degree = primary_resume_edu.get("degree")
        if user_degree and resume_degree and user_degree.strip().lower() not in resume_degree.strip().lower() and resume_degree.strip().lower() not in user_degree.strip().lower():
            conflicts.append({
                "field_name": "Degree",
                "user_value": str(user_degree),
                "resume_value": str(resume_degree),
                "resolution": "preserved_user_input",
                "explanation": f"Profile degree '{user_degree}' differs from resume extracted degree '{resume_degree}'. Your input is preserved."
            })

        # 3. Check Graduation Year
        user_grad_year = user_profile_data.get("graduation_year")
        resume_grad_year = primary_resume_edu.get("graduation_year")
        if user_grad_year and resume_grad_year and int(user_grad_year) != int(resume_grad_year):
            conflicts.append({
                "field_name": "Graduation Year",
                "user_value": str(user_grad_year),
                "resume_value": str(resume_grad_year),
                "resolution": "preserved_user_input",
                "explanation": f"Profile graduation year '{user_grad_year}' differs from resume extracted year '{resume_grad_year}'. Your input is preserved."
            })

        # 4. Check College/University
        user_college = user_profile_data.get("college")
        resume_institution = primary_resume_edu.get("institution")
        if user_college and resume_institution:
            # Check if neither is substring of another
            u_c = user_college.strip().lower()
            r_c = resume_institution.strip().lower()
            if u_c not in r_c and r_c not in u_c:
                conflicts.append({
                    "field_name": "College / University",
                    "user_value": str(user_college),
                    "resume_value": str(resume_institution),
                    "resolution": "preserved_user_input",
                    "explanation": f"Profile institution '{user_college}' differs from resume extracted '{resume_institution}'. Your input is preserved."
                })

        return conflicts
