import re
from typing import Dict, Any, List, Optional, Tuple

class ProfileExtractor:
    # Deterministic Regex Patterns
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
    
    # Supports Indian 10-digit formats (+91, 0, dashes, spaces) and international
    PHONE_PATTERN = re.compile(r'(?:(?:\+91|0)?[ -]?)?(?:[6-9]\d{9}|(?:\d{3,5}[ -]?\d{6,8}))\b')
    
    LINKEDIN_PATTERN = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)/?', re.IGNORECASE)
    GITHUB_PATTERN = re.compile(r'(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)/?', re.IGNORECASE)
    PORTFOLIO_PATTERN = re.compile(r'(?:https?://)?(?:www\.)?([A-Za-z0-9_-]+\.(?:io|me|dev|app|tech|in|com)(?:/[^\s]*)?)', re.IGNORECASE)

    DEGREE_PATTERNS = [
        (r'\b(B\.?Tech|Bachelor of Technology|B\.?E\.?|Bachelor of Engineering)\b', 'B.Tech', 'Undergraduate'),
        (r'\b(M\.?Tech|Master of Technology|M\.?E\.?|Master of Engineering)\b', 'M.Tech', 'Postgraduate'),
        (r'\b(BCA|Bachelor of Computer Applications)\b', 'BCA', 'Undergraduate'),
        (r'\b(MCA|Master of Computer Applications)\b', 'MCA', 'Postgraduate'),
        (r'\b(B\.?Sc|Bachelor of Science)\b', 'B.Sc', 'Undergraduate'),
        (r'\b(M\.?Sc|Master of Science)\b', 'M.Sc', 'Postgraduate'),
        (r'\b(Diploma in [A-Za-z\s]+|Polytechnic)\b', 'Diploma', 'Diploma'),
        (r'\b(Senior Secondary|Higher Secondary|12th|HSC|Class XII)\b', '12th Standard', 'High School'),
        (r'\b(Secondary School|Secondary|10th|SSC|Class X)\b', '10th Standard', 'High School'),
    ]

    BRANCH_PATTERNS = [
        r'Information Technology',
        r'Computer Science(?: and Engineering)?',
        r'Electronics and Communication(?: Engineering)?',
        r'Electrical(?: and Electronics)? Engineering',
        r'Mechanical Engineering',
        r'Civil Engineering',
        r'Artificial Intelligence(?: and Data Science)?|\bAI\s*&\s*DS\b|\bAIML\b',
        r'Data Science',
        r'\bCSE\b',
        r'\bECE\b',
        r'\bEEE\b',
        r'(?<!and\s)\bIT\b',
    ]

    BRANCH_MAP = {
        'IT': 'Information Technology',
        'CSE': 'Computer Science',
        'ECE': 'Electronics and Communication',
        'EEE': 'Electrical and Electronics Engineering',
        'ME': 'Mechanical Engineering',
        'CE': 'Civil Engineering',
        'AIML': 'Artificial Intelligence',
    }

    CGPA_PATTERN = re.compile(r'\b(?:C?GPA|SGPA)[\s:]*([0-9](?:\.[0-9]{1,2})?)(?:\s*/\s*(?:10(?:\.0)?|4(?:\.0)?))?\b', re.IGNORECASE)
    PERCENTAGE_PATTERN = re.compile(r'\b([4-9][0-9](?:\.[0-9]{1,2})?)\s*%')
    YEAR_PATTERN = re.compile(r'\b(19[9-9][0-9]|20[0-3][0-9])\b')

    @classmethod
    def extract_personal_info(cls, raw_text: str, personal_section: str = "") -> Dict[str, Any]:
        source_text = f"{personal_section}\n{raw_text[:2500]}"
        
        # Email
        emails = cls.EMAIL_PATTERN.findall(source_text)
        email = emails[0] if emails else None
        email_conf = 0.99 if email else 0.0

        # Phone
        phones = cls.PHONE_PATTERN.findall(source_text)
        phone = None
        for p in phones:
            cleaned_p = re.sub(r'[^\d+]', '', p)
            if len(cleaned_p) >= 10:
                phone = p.strip()
                break
        phone_conf = 0.95 if phone else 0.0

        # URLs
        linkedin_match = cls.LINKEDIN_PATTERN.search(source_text)
        linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None

        github_match = cls.GITHUB_PATTERN.search(source_text)
        github = f"https://github.com/{github_match.group(1)}" if github_match else None

        portfolio_match = cls.PORTFOLIO_PATTERN.search(source_text)
        portfolio = None
        if portfolio_match:
            match_url = portfolio_match.group(0).lower()
            excluded_domains = ["linkedin.com", "github.com", "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "kaggle.com"]
            if not any(d in match_url for d in excluded_domains):
                start_pos = portfolio_match.start()
                if start_pos == 0 or source_text[start_pos - 1] != "@":
                    portfolio = portfolio_match.group(0)

        # City / Location heuristic
        location = None
        cities = ["Bengaluru", "Bangalore", "Delhi", "New Delhi", "Mumbai", "Hyderabad", "Pune", "Jaipur", "Chennai", "Kolkata", "Noida", "Gurugram", "Gurgaon", "Ahmedabad", "Indore", "Chandigarh"]
        for city in cities:
            if re.search(rf'\b{city}\b', source_text, re.IGNORECASE):
                location = city
                break

        # Name heuristic
        name = None
        first_lines = [line.strip() for line in source_text.split("\n") if line.strip()]

        EXCLUDED_NAME_WORDS = {
            "profile", "language", "languages", "education", "experience", "skills",
            "contact", "contact me", "objective", "resume", "curriculum vitae",
            "native", "fluent", "hindi", "english", "spanish", "french", "german"
        }

        # 1. If email exists, prioritize finding candidate's name that matches email username
        if email:
            email_user = email.split('@')[0].lower()
            for line in first_lines[:50]:
                candidate = line
                if '|' in candidate:
                    candidate = candidate.split('|')[0].strip()
                for city in cities:
                    candidate = re.sub(rf'\b{city}.*$', '', candidate, flags=re.IGNORECASE).strip(" ,-–—")
                words = candidate.split()
                if 2 <= len(words) <= 3 and all(w.isalpha() for w in words):
                    if any(w.lower() in EXCLUDED_NAME_WORDS for w in words):
                        continue
                    if all(w.lower() in email_user for w in words):
                        name = candidate.title()
                        break

        # 2. Direct line check on early lines
        if not name:
            for line in first_lines[:8]:
                candidate = line
                if '|' in candidate:
                    candidate = candidate.split('|')[0].strip()
                for city in cities:
                    candidate = re.sub(rf'\b{city}.*$', '', candidate, flags=re.IGNORECASE).strip(" ,-–—")

                if candidate.lower() in EXCLUDED_NAME_WORDS:
                    continue

                words = candidate.split()
                if 2 <= len(words) <= 4 and not re.search(r'[@\d+:|/\\_#]', candidate):
                    if any(w.lower() in EXCLUDED_NAME_WORDS for w in words):
                        continue
                    name = candidate.title()
                    break

        # 3. Fallback check for capitalized 2-word names
        if not name:
            for line in first_lines[:25]:
                clean_l = line.strip()
                words = clean_l.split()
                if 2 <= len(words) <= 3 and all(w.isalpha() for w in words):
                    if any(w.lower() in EXCLUDED_NAME_WORDS for w in words):
                        continue
                    if clean_l.isupper() or all(w[0].isupper() for w in words):
                        name = clean_l.title()
                        break

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "city": location,
            "linkedin": linkedin,
            "github": github,
            "portfolio": portfolio,
            "confidence": {
                "name": 0.85 if name else 0.0,
                "email": email_conf,
                "phone": phone_conf,
                "city": 0.75 if location else 0.0,
                "linkedin": 0.98 if linkedin else 0.0,
                "github": 0.98 if github else 0.0,
            }
        }

    @classmethod
    def extract_education(cls, education_section: str) -> List[Dict[str, Any]]:
        if not education_section:
            return []

        lines = [l.strip() for l in education_section.split("\n") if l.strip()]
        if not lines:
            return []

        records = []
        current_institution = None
        current_entry = None

        def finalize_entry(entry):
            if entry and entry.get("degree"):
                records.append({
                    "degree": entry["degree"],
                    "education_level": entry.get("education_level", "Undergraduate"),
                    "field": entry.get("field"),
                    "institution": entry.get("institution") or current_institution,
                    "graduation_year": entry.get("graduation_year"),
                    "cgpa": entry.get("cgpa"),
                    "percentage": entry.get("percentage"),
                    "confidence": 0.88 if entry.get("degree") and (entry.get("graduation_year") or entry.get("cgpa") or entry.get("percentage")) else 0.70
                })

        for line in lines:
            cleaned_line = re.sub(r'^\s*[-•*]\s*', '', line).strip()
            if not cleaned_line:
                continue

            detected_degree = None
            detected_level = None

            # 1. Check left of separator (prevents 'Senior Secondary' in school name matching on a 10th line)
            left_part = re.split(r'\s*[-–—|]\s*', cleaned_line)[0].strip()
            for pattern, deg_name, lvl in cls.DEGREE_PATTERNS:
                if re.search(pattern, left_part, re.IGNORECASE):
                    detected_degree = deg_name
                    detected_level = lvl
                    break

            # 2. Check full line if not matched on left of separator
            if not detected_degree:
                for pattern, deg_name, lvl in cls.DEGREE_PATTERNS:
                    if re.search(pattern, cleaned_line, re.IGNORECASE):
                        detected_degree = deg_name
                        detected_level = lvl
                        break

            # If no degree found on this line
            if not detected_degree:
                # Check if it's an institution header line: e.g. "SVM CHILDREN’S ACADEMY, JAIPUR"
                if re.search(r'college|university|institute|school|academy|campus|SVGMS', cleaned_line, re.IGNORECASE):
                    clean_inst = cls.YEAR_PATTERN.sub('', cleaned_line)
                    clean_inst = re.sub(r'\b(?:Currently|\d+(?:st|nd|rd|th)?\s*Year|Present)\b', '', clean_inst, flags=re.I)
                    clean_inst = re.sub(r'[\d\+\.\-]+|(?:SGPA|CGPA).*', '', clean_inst, flags=re.I).strip(" -–—|,•()")
                    if len(clean_inst) >= 3:
                        current_institution = clean_inst
                # Check if this line contains metrics or fields for current entry
                if current_entry:
                    cgpa_m = cls.CGPA_PATTERN.search(cleaned_line)
                    if cgpa_m and not current_entry.get("cgpa"):
                        try:
                            current_entry["cgpa"] = float(cgpa_m.group(1))
                        except ValueError:
                            pass
                    pct_m = cls.PERCENTAGE_PATTERN.search(cleaned_line)
                    if pct_m and not current_entry.get("percentage"):
                        try:
                            current_entry["percentage"] = float(pct_m.group(1))
                        except ValueError:
                            pass
                    years = cls.YEAR_PATTERN.findall(cleaned_line)
                    if years and not current_entry.get("graduation_year"):
                        current_entry["graduation_year"] = int(max(years))
                    if not current_entry.get("field"):
                        for br_pattern in cls.BRANCH_PATTERNS:
                            m = re.search(br_pattern, cleaned_line, re.IGNORECASE)
                            if m:
                                raw_br = m.group(0)
                                current_entry["field"] = cls.BRANCH_MAP.get(raw_br.upper(), raw_br)
                                break
                continue

            # A new degree was detected: finalize previous entry
            finalize_entry(current_entry)

            # Extract institution for this entry
            inst = None
            sep_parts = re.split(r'\s*[-–—|]\s*', cleaned_line)
            if len(sep_parts) >= 2:
                right_cand = sep_parts[1].strip()
                if re.search(r'college|university|institute|school|academy|campus|SVGMS', right_cand, re.I):
                    clean_inst = cls.YEAR_PATTERN.sub('', right_cand)
                    clean_inst = re.sub(r'\b(?:Currently|\d+(?:st|nd|rd|th)?\s*Year|Present)\b', '', clean_inst, flags=re.I)
                    clean_inst = re.sub(r'[\d\+\.\-]+|(?:SGPA|CGPA).*', '', clean_inst, flags=re.I).strip(" -–—|,•()")
                    inst = clean_inst if len(clean_inst) >= 3 else right_cand

            if not inst:
                parts = re.split(r'\bfrom\s+', cleaned_line, flags=re.IGNORECASE)
                for part in parts[1:]:
                    clean_part = re.split(r'\b(?:from|with|in\s+\d{4}|having)\b', part, flags=re.IGNORECASE)[0].strip(" -–—|,•()")
                    if re.search(r'school|college|university|institute|academy|SVGMS|campus', clean_part, re.IGNORECASE):
                        inst = clean_part
                        break

            if not inst and re.search(r'college|university|institute|school|academy|campus|SVGMS', cleaned_line, re.IGNORECASE):
                clean_inst = cls.YEAR_PATTERN.sub('', cleaned_line)
                clean_inst = re.sub(r'[\d\+\.\-]+|(?:SGPA|CGPA).*', '', clean_inst, flags=re.IGNORECASE).strip(" -–—|,•()")
                inst = clean_inst if clean_inst else cleaned_line

            if inst:
                current_institution = inst

            branch = None
            for br_pattern in cls.BRANCH_PATTERNS:
                m = re.search(br_pattern, cleaned_line, re.IGNORECASE)
                if m:
                    raw_br = m.group(0)
                    branch = cls.BRANCH_MAP.get(raw_br.upper(), raw_br)
                    break

            cgpa = None
            cgpa_m = cls.CGPA_PATTERN.search(cleaned_line)
            if cgpa_m:
                try:
                    cgpa = float(cgpa_m.group(1))
                except ValueError:
                    pass

            pct = None
            pct_m = cls.PERCENTAGE_PATTERN.search(cleaned_line)
            if pct_m:
                try:
                    pct = float(pct_m.group(1))
                except ValueError:
                    pass

            years = cls.YEAR_PATTERN.findall(cleaned_line)
            year = int(max(years)) if years else None

            current_entry = {
                "degree": detected_degree,
                "education_level": detected_level,
                "field": branch,
                "institution": inst or current_institution,
                "graduation_year": year,
                "cgpa": cgpa,
                "percentage": pct
            }

        finalize_entry(current_entry)
        return records

    PROJECT_ACTION_VERBS = {
        'built', 'developed', 'created', 'designed', 'implemented', 'trained',
        'engineered', 'utilized', 'led', 'managed', 'automated', 'integrated',
        'conducted', 'analyzed', 'tested', 'deployed', 'performed', 'assisted',
        'worked', 'maintained', 'contributed', 'fine-tuned', 'achieved',
        'spearheaded', 'evaluated', 'orchestrated', 'monitored', 'architected',
        'modeled', 'prepared', 'extracted', 'programmed', 'authored', 'established'
    }

    DATE_RANGE_REGEX = re.compile(
        r'\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{4})\s*(?:[-–—]|to)\s*(Present|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{4})\b',
        re.IGNORECASE
    )

    ROLE_KEYWORDS = re.compile(
        r'\b(Intern(?:ship)?|Engineer|Developer|Analyst|Consultant|Scientist|Lead|Founder|Co-Founder|Manager|Associate|Specialist|Researcher|Trainee|Administrator|Architect|Organizer|Coordinator|Designer|Executive|Representative|Officer)\b',
        re.IGNORECASE
    )

    CONTINUATION_START_WORDS = {
        'and', 'or', 'in', 'to', 'for', 'with', 'by', 'from', 'of', 'on', 'at',
        'as', 'including', 'across', 'using', 'into', 'while', 'where', 'which',
        'that', 'through', 'under', 'between', 'during'
    }

    DURATION_REGEX = re.compile(r'^\d+\s*(?:Months?|Years?|Wks?|Weeks?|Days?)\b', re.I)
    MODE_REGEX = re.compile(r'^(?:Remote|On-site|Hybrid|Full[- ]time|Part[- ]time|Contract|Freelance)\b', re.I)

    @classmethod
    def is_tech_stack_line(cls, line: str) -> bool:
        line_clean = line.strip()
        if not line_clean:
            return False
        # Matches prefix like "Technologies: Python, SQL", "Tech Stack: React", "Tools Used: ..."
        if re.match(r'^(?:tech(?:nologies)?|tech\s*stack|tools(?:\s+used)?|skills|built\s+with|environment)\s*[:\-]', line_clean, re.I):
            return True
        # Comma, pipe, or slash separated short items (skills / libraries)
        parts = [p.strip() for p in re.split(r'[,|/•]', line_clean) if p.strip()]
        if len(parts) >= 2:
            # Check if elements are short names (e.g. "Python", "Machine Learning", "n8n", "Firebase")
            all_short = all(1 <= len(p.split()) <= 3 for p in parts)
            has_action_verb = any(p.split()[0].lower() in cls.PROJECT_ACTION_VERBS for p in parts if p.split())
            if all_short and not has_action_verb:
                return True
        return False

    @classmethod
    def is_project_title_line(cls, line: str, prev_line: str = "") -> bool:
        clean = line.strip()
        if not clean:
            return False
        # Bullet points are not titles
        if re.match(r'^[\-•*+–—]|\([iIvVxX\d]+\)', clean):
            return False
        # Project titles never end with a period
        if clean.endswith('.'):
            return False
        # If line starts with a lowercase letter or continuation punctuation, it's a wrapped line
        if clean[0].islower() or clean[0] in ',.;:)%':
            return False
        # If previous line was a bullet that didn't end with terminal punctuation, this line is continuation
        if prev_line:
            prev_clean = prev_line.strip()
            if re.match(r'^[\-•*+–—]', prev_clean) and not prev_clean.endswith(('.', '!', '?', ';', ':')):
                return False
        # Starts with an action verb (e.g. "Built a platform...") -> description, not title
        first_word = re.sub(r'^[^\w]+', '', clean).split()[0].lower() if clean.split() else ''
        if first_word in cls.PROJECT_ACTION_VERBS:
            return False
        # Dedicated tech stack line
        if cls.is_tech_stack_line(clean):
            return False
        # Dedicated URL line
        if re.match(r'^(?:https?://|(?:url|link|github|demo)\s*[:\-])', clean, re.I):
            return False
        # Length constraint: Titles are typically concise
        words = clean.split()
        if len(words) > 14 or len(clean) > 85:
            return False
        return True

    @classmethod
    def parse_project_title(cls, raw_title: str) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Decomposes a project title line like:
        - "Resume Screening System — NLP, ML, Python 2024" -> ("Resume Screening System", "NLP, ML, Python", "2024")
        - "RideHive — Uber Clone (MERN, Socket.IO) 2024" -> ("RideHive — Uber Clone", "MERN, Socket.IO", "2024")
        """
        cleaned = re.sub(r'^\d+[\.\)]\s*', '', raw_title).strip(' -–—:•|')
        year_match = re.search(r'\b(20\d{2})\b\s*$', cleaned)
        year = year_match.group(1) if year_match else None
        if year_match:
            cleaned = cleaned[:year_match.start()].strip(' -–—:,|')

        tech_part = None
        title = cleaned

        # Check if ends with parenthesized tech stack: 'Title (React, Node.js)'
        paren_match = re.search(r'\(([^)]+)\)\s*$', cleaned)
        if paren_match:
            inner = paren_match.group(1).strip()
            if len(inner.split(',')) >= 2 or re.search(r'\b(MERN|React|Node|Python|Socket|SQL|AI|ML)\b', inner, re.I):
                tech_part = inner
                title = cleaned[:paren_match.start()].strip(' -–—:,|')
                return title, tech_part, year

        # Check for separator like ' — ', ' – ', ' - ', ' | '
        sep_match = re.search(r'\s+[-–—|]\s+', cleaned)
        if sep_match:
            cand_title = cleaned[:sep_match.start()].strip()
            cand_tech = cleaned[sep_match.end():].strip()
            if len(cand_tech.split(',')) >= 2 or re.search(r'\b(Python|ML|NLP|React|Node|MERN|SQL|Java|Flutter|AWS|Streamlit)\b', cand_tech, re.I):
                title = cand_title
                tech_part = cand_tech
                return title, tech_part, year

        # Check if comma-separated tech stack at the tail: e.g. "Personal Portfolio Website HTML, CSS, JavaScript"
        comma_parts = [p.strip() for p in cleaned.split(',')]
        if len(comma_parts) >= 2:
            tech_kw = r'\b(HTML\d?|CSS\d?|JavaScript|JS|React(?:\.js)?|Node(?:\.js)?|Express(?:\.js)?|Python|PHP|MySQL|MongoDB|SQL|Django|Flask|C|C\+\+|Java|Firebase|n8n|Tailwind|MERN)\b'
            subsequent_are_tech = all(re.search(tech_kw, p, re.I) for p in comma_parts[1:])
            if subsequent_are_tech:
                first_part = comma_parts[0]
                first_words = first_part.split()
                if len(first_words) >= 2 and re.search(tech_kw, first_words[-1], re.I):
                    cand_title = " ".join(first_words[:-1]).strip()
                    cand_tech = first_words[-1] + ", " + ", ".join(comma_parts[1:])
                    return cand_title, cand_tech, year

        return title, tech_part, year

    @classmethod
    def extract_projects(cls, projects_section: str) -> List[Dict[str, Any]]:
        if not projects_section:
            return []

        lines = [l.strip() for l in projects_section.split("\n") if l.strip()]
        if not lines:
            return []

        projects: List[Dict[str, Any]] = []
        current_proj: Optional[Dict[str, Any]] = None

        for idx, line in enumerate(lines):
            prev_line = lines[idx - 1] if idx > 0 else ""
            url_match = re.search(r'https?://[^\s]+', line)
            if re.match(r'^(?:url|link|github|demo)\s*:\s*https?://', line, re.I) and current_proj:
                current_proj["url"] = url_match.group(0)
                continue

            if cls.is_project_title_line(line, prev_line):
                title, inline_tech, year = cls.parse_project_title(line)
                if len(title) >= 3:
                    if current_proj:
                        projects.append(current_proj)
                    current_proj = {
                        "name": title[:65],
                        "description": "",
                        "tech_raw": inline_tech or "",
                        "technologies": [],
                        "url": url_match.group(0) if url_match else None
                    }
                    continue

            if current_proj:
                if cls.is_tech_stack_line(line) and not current_proj["tech_raw"]:
                    cleaned_tech = re.sub(r'^(?:tech(?:nologies)?|tech\s*stack|tools(?:\s+used)?|skills|built\s+with|environment)\s*[:\-]\s*', '', line, flags=re.I)
                    current_proj["tech_raw"] = cleaned_tech
                else:
                    if url_match and not current_proj["url"]:
                        current_proj["url"] = url_match.group(0)
                    bullet_clean = re.sub(r'^[\-•*+–—]\s*', '', line).strip()
                    if bullet_clean:
                        if current_proj["description"]:
                            current_proj["description"] += " " + bullet_clean
                        else:
                            current_proj["description"] = bullet_clean
            else:
                title, inline_tech, year = cls.parse_project_title(line)
                current_proj = {
                    "name": title[:65],
                    "description": "",
                    "tech_raw": inline_tech or "",
                    "technologies": [],
                    "url": url_match.group(0) if url_match else None
                }

        if current_proj:
            projects.append(current_proj)

        return projects[:6]

    @classmethod
    def extract_experience(cls, experience_section: str) -> List[Dict[str, Any]]:
        if not experience_section:
            return []

        raw_lines = [l.strip() for l in experience_section.split("\n") if l.strip()]
        if not raw_lines:
            return []

        # Filter out quote marks and noise lines
        lines = []
        for l in raw_lines:
            cleaned = re.sub(r"^[\"'\s\-–—*•]+|[\"'\s\-–—*•]+$", "", l).strip()
            if not cleaned:
                continue
            lines.append(l)

        experiences: List[Dict[str, Any]] = []
        current_exp: Optional[Dict[str, Any]] = None

        def finalize_current():
            nonlocal current_exp
            if not current_exp:
                return
            role = current_exp.get("role") or ""
            company = current_exp.get("company") or ""
            desc = current_exp.get("description") or ""
            # Filter out entries where role or company is just noise or invalid
            if not role and not company:
                current_exp = None
                return
            if len(company) <= 2 and not role:
                current_exp = None
                return
            experiences.append(current_exp)
            current_exp = None

        for line in lines:
            is_bullet = bool(re.match(r'^[\-•*+–—]\s+|\s*-\s+', line))
            clean_line = line.strip(" -•*+–—\"'")

            if not clean_line:
                continue

            # Standalone duration or work mode
            if cls.DURATION_REGEX.match(clean_line):
                continue
            if cls.MODE_REGEX.match(clean_line) and len(clean_line.split()) <= 2:
                continue

            first_word = clean_line.split()[0].lower().rstrip(',:;')

            # Check if this line is clearly a sentence continuation of previous description
            is_continuation = False
            if current_exp and current_exp["description"]:
                if first_word in cls.CONTINUATION_START_WORDS or clean_line[0].islower():
                    is_continuation = True
                elif first_word in cls.PROJECT_ACTION_VERBS and not is_bullet:
                    is_continuation = True

            if is_continuation:
                current_exp["description"] += " " + clean_line
                continue

            if is_bullet:
                bullet_clean = re.sub(r'^[\-•*+–—\s]+', '', line).strip()
                if current_exp:
                    if current_exp["description"]:
                        current_exp["description"] += " " + bullet_clean
                    else:
                        current_exp["description"] = bullet_clean
                continue

            date_match = cls.DATE_RANGE_REGEX.search(clean_line)
            single_year_match = re.search(r'\b(20[1-3][0-9])\b', clean_line) if not date_match else None

            # Determine if this line should start a NEW experience entry
            start_new = False
            if current_exp is None:
                start_new = True
            elif current_exp["description"]:
                # Previous entry has description text.
                # A new entry starts if line has a date, a role keyword, or is a short capitalized title
                if date_match or single_year_match or cls.ROLE_KEYWORDS.search(clean_line) or (len(clean_line.split()) <= 7 and clean_line[0].isupper() and not clean_line.endswith('.')):
                    start_new = True
                else:
                    # Treat as continuation description
                    current_exp["description"] += " " + clean_line
                    continue
            else:
                # Still in header block of current entry (no description yet)
                has_role_and_company = bool(current_exp["role"] and current_exp["company"])
                if has_role_and_company and (date_match or (cls.ROLE_KEYWORDS.search(clean_line) and len(clean_line.split()) <= 4)):
                    start_new = True

            if start_new:
                finalize_current()
                current_exp = {
                    "role": None,
                    "company": None,
                    "start_date": None,
                    "end_date": None,
                    "description": ""
                }

            # Extract dates
            if date_match and not current_exp["start_date"]:
                current_exp["start_date"] = date_match.group(1)
                current_exp["end_date"] = date_match.group(2)
            elif single_year_match and not current_exp["start_date"]:
                current_exp["start_date"] = single_year_match.group(1)

            # Check if date was in middle of line: e.g. "Next Gen Data Minds 2026 – Present Social Lead"
            if date_match:
                left_text = clean_line[:date_match.start()].strip(' -–—|,•()')
                right_text = clean_line[date_match.end():].strip(' -–—|,•()')
                if left_text and right_text:
                    if cls.ROLE_KEYWORDS.search(right_text):
                        if not current_exp["role"]:
                            current_exp["role"] = right_text
                        if not current_exp["company"]:
                            current_exp["company"] = left_text
                        continue
                    elif cls.ROLE_KEYWORDS.search(left_text):
                        if not current_exp["role"]:
                            current_exp["role"] = left_text
                        if not current_exp["company"]:
                            current_exp["company"] = right_text
                        continue

            # Remove dates to extract role & company
            line_no_date = cls.DATE_RANGE_REGEX.sub('', clean_line)
            if single_year_match and not date_match:
                line_no_date = re.sub(r'\b20[1-3][0-9]\b', '', line_no_date)
            line_no_date = re.sub(r'\b(?:Present|Remote|On-site|Hybrid)\b', '', line_no_date, flags=re.I).strip(" -–—|,•()")

            if not line_no_date:
                continue

            divider_parts = re.split(r'\s*(?:\|| - | — | at )\s*', line_no_date)
            if len(divider_parts) >= 2:
                p1, p2 = divider_parts[0].strip(), divider_parts[1].strip()
                if cls.ROLE_KEYWORDS.search(p1):
                    if not current_exp["role"]:
                        current_exp["role"] = p1
                    if not current_exp["company"]:
                        current_exp["company"] = p2
                else:
                    if not current_exp["company"]:
                        current_exp["company"] = p1
                    if not current_exp["role"]:
                        current_exp["role"] = p2
                continue

            role_match = cls.ROLE_KEYWORDS.search(line_no_date)
            if role_match and (role_match.start() == 0 or len(line_no_date[:role_match.end()].split()) <= 4):
                role_end = role_match.end()
                role_cand = line_no_date[:role_end].strip()
                comp_cand = line_no_date[role_end:].strip(' -–—|,•()')
                if comp_cand and not current_exp["company"]:
                    current_exp["role"] = role_cand
                    current_exp["company"] = comp_cand
                    continue
                elif not current_exp["role"]:
                    current_exp["role"] = line_no_date
                    continue

            if cls.ROLE_KEYWORDS.search(line_no_date):
                if not current_exp["role"]:
                    current_exp["role"] = line_no_date
                elif not current_exp["company"]:
                    current_exp["company"] = line_no_date
                continue

            if not current_exp["company"]:
                current_exp["company"] = line_no_date
            elif not current_exp["role"]:
                current_exp["role"] = line_no_date
            else:
                if len(line_no_date.split()) <= 8:
                    if current_exp["description"]:
                        current_exp["description"] = line_no_date + ". " + current_exp["description"]
                    else:
                        current_exp["description"] = line_no_date

        finalize_current()

        for exp in experiences:
            if not exp["role"] and exp["company"]:
                exp["role"] = "Intern / Professional"
            elif not exp["role"]:
                exp["role"] = "Experience"

        return experiences[:6]

    @classmethod
    def extract_certifications(cls, cert_section: str) -> List[Dict[str, Any]]:
        if not cert_section:
            return []

        certifications = []
        lines = [l.strip(" -•*") for l in cert_section.split("\n") if l.strip(" -•*")]
        for line in lines:
            if len(line) < 4:
                continue

            issuer = None
            cert_name = line
            date_str = None

            # Extract date in parentheses at the end: e.g. "Soft Skills (Jul 2025)"
            date_paren_match = re.search(r'\((?:[A-Za-z]{3,9}\s+)?20\d{2}\)\s*$', line)
            if date_paren_match:
                date_str = date_paren_match.group(0).strip("()")
                line_no_date = line[:date_paren_match.start()].strip()
            else:
                line_no_date = line

            # Check if formatted as "<Cert Name> – <Issuer>" or "<Issuer> – <Cert Name>"
            sep_match = re.search(r'\s+[-–—|]\s+', line_no_date)
            if sep_match:
                cand_left = line_no_date[:sep_match.start()].strip()
                cand_right = line_no_date[sep_match.end():].strip()

                common_issuers = [
                    "Google", "Coursera", "AWS", "Microsoft", "Udemy", "HackerRank",
                    "LinkedIn", "IBM", "Meta", "Coding Ninjas", "LeetCode", "CodeChef",
                    "GeeksforGeeks", "freeCodeCamp", "NPTEL", "Infosys"
                ]

                if any(ci.lower() == cand_left.lower() or ci.lower() in cand_left.lower() for ci in common_issuers):
                    issuer = cand_left
                    cert_name = cand_right
                elif any(ci.lower() == cand_right.lower() or ci.lower() in cand_right.lower() for ci in common_issuers):
                    issuer = cand_right
                    cert_name = cand_left
                elif len(cand_right.split()) <= 4:
                    cert_name = cand_left
                    issuer = cand_right

            if not issuer:
                for common_issuer in [
                    "Google", "Coursera", "AWS", "Microsoft", "Udemy", "HackerRank",
                    "LinkedIn", "IBM", "Meta", "Coding Ninjas", "LeetCode", "CodeChef",
                    "GeeksforGeeks", "freeCodeCamp", "NPTEL", "Infosys"
                ]:
                    if common_issuer.lower() in line_no_date.lower():
                        issuer = common_issuer
                        break

            certifications.append({
                "name": cert_name,
                "issuer": issuer or "Accredited Organization",
                "date": date_str,
                "credential_url": None
            })

        return certifications[:8]

    @classmethod
    def infer_primary_role(cls, skills: List[Dict[str, Any]], raw_text: str = "") -> Dict[str, Any]:
        """
        Deterministically infers candidate's primary technical domain and target job role
        based on extracted skill frequencies, project keywords, and resume context.
        """
        skill_names = [s.get("canonical_name", "").lower() for s in skills]
        text_lower = raw_text.lower() if raw_text else " ".join(skill_names)

        # Domain Cluster Scoring
        scores = {
            "ROBOTICS_EMBEDDED": 0,
            "AI_ML": 0,
            "SWE": 0,
            "CLOUD_DEVOPS": 0,
            "SECURITY": 0,
            "DATA": 0
        }

        # 1. Robotics & Embedded
        robotics_keys = ["ros", "ros2", "slam", "gazebo", "kinematics", "dynamics", "motion planning", "path planning", "mechatronics", "autonomous"]
        embedded_keys = ["embedded c", "rtos", "freertos", "stm32", "arduino", "esp32", "microcontroller", "microcontrollers", "arm cortex", "pcb design", "altium", "kicad", "i2c", "spi", "can bus", "firmware", "sensors & actuators", "pid control", "plc", "scada", "solidworks", "matlab & simulink"]
        
        for k in robotics_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["ROBOTICS_EMBEDDED"] += 3
        for k in embedded_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["ROBOTICS_EMBEDDED"] += 2
        if any("c++" in s for s in skill_names) and scores["ROBOTICS_EMBEDDED"] > 0:
            scores["ROBOTICS_EMBEDDED"] += 2

        # 2. AI / ML
        aiml_keys = ["machine learning", "deep learning", "generative ai", "natural language processing", "computer vision", "opencv", "pytorch", "tensorflow", "scikit-learn", "llm", "transformers", "neural networks"]
        for k in aiml_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["AI_ML"] += 2

        # 3. SWE / Web / Fullstack
        swe_keys = ["react", "next.js", "vue", "angular", "node.js", "express", "django", "fastapi", "flask", "typescript", "javascript", "html/css", "java", "spring boot", "c#", ".net", "golang", "rest api", "full stack"]
        for k in swe_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["SWE"] += 2

        # 4. Cloud / DevOps
        devops_keys = ["docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "terraform", "ansible", "linux", "jenkins", "devops", "sre"]
        for k in devops_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["CLOUD_DEVOPS"] += 2

        # 5. Security
        security_keys = ["cybersecurity", "penetration testing", "soc", "owasp", "network security", "ethical hacking", "siem", "wireshark", "cryptography", "infosec"]
        for k in security_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["SECURITY"] += 2

        # 6. Data
        data_keys = ["data analyst", "data scientist", "sql", "power bi", "tableau", "excel", "pandas", "numpy", "data analysis", "etl", "spark", "business intelligence"]
        for k in data_keys:
            if any(k in s for s in skill_names) or re.search(rf'\b{re.escape(k)}\b', text_lower):
                scores["DATA"] += 1.5

        top_domain = max(scores, key=scores.get)
        top_score = scores[top_domain]

        if top_score == 0:
            return {
                "inferred_domain": "Software Engineering",
                "inferred_target_role": "Software Engineer",
                "confidence": 0.5,
                "domain_scores": scores
            }

        # Sub-role mapping based on specifics
        inferred_role = "Software Engineer"
        confidence = min(0.96, 0.6 + (top_score * 0.05))

        if top_domain == "ROBOTICS_EMBEDDED":
            if any(k in text_lower for k in ["ros", "ros2", "slam", "gazebo", "kinematics", "robotics", "robot", "autonomous"]):
                inferred_role = "Robotics Engineer"
            elif any(k in text_lower for k in ["rtos", "firmware", "stm32", "microcontroller", "embedded c", "embedded engineer"]):
                inferred_role = "Embedded Systems Engineer"
            elif any(k in text_lower for k in ["iot", "esp32", "edge", "mqtt"]):
                inferred_role = "IoT & Firmware Engineer"
            elif any(k in text_lower for k in ["plc", "scada", "automation", "controls"]):
                inferred_role = "Automation & Controls Engineer"
            elif any(k in text_lower for k in ["pcb", "altium", "kicad", "circuit", "hardware"]):
                inferred_role = "Hardware / PCB Design Engineer"
            else:
                inferred_role = "Robotics Engineer"
            domain_label = "Robotics & Embedded Systems"

        elif top_domain == "AI_ML":
            if any(k in text_lower for k in ["computer vision", "opencv", "yolo", "image"]):
                inferred_role = "Computer Vision Engineer"
            elif any(k in text_lower for k in ["nlp", "natural language", "llm", "bert", "gpt"]):
                inferred_role = "NLP Engineer"
            elif any(k in text_lower for k in ["mlops", "model deployment", "kubeflow"]):
                inferred_role = "MLOps Engineer"
            else:
                inferred_role = "Machine Learning Engineer"
            domain_label = "AI & Machine Learning"

        elif top_domain == "SWE":
            if any(k in text_lower for k in ["react", "frontend", "ui", "tailwind", "next.js", "vue"]):
                inferred_role = "Frontend Developer" if not any(k in text_lower for k in ["backend", "database", "sql", "api", "node.js"]) else "Full Stack Developer"
            elif any(k in text_lower for k in ["backend", "fastapi", "django", "spring boot", "microservices"]):
                inferred_role = "Backend Developer"
            else:
                inferred_role = "Software Engineer"
            domain_label = "Software Engineering"

        elif top_domain == "CLOUD_DEVOPS":
            inferred_role = "DevOps Engineer"
            domain_label = "Cloud & DevOps"

        elif top_domain == "SECURITY":
            inferred_role = "Cybersecurity Analyst"
            domain_label = "Cybersecurity"

        else: # DATA
            if any(k in text_lower for k in ["spark", "etl", "data warehouse", "airflow", "hadoop"]):
                inferred_role = "Data Engineer"
            elif any(k in text_lower for k in ["data scientist", "predictive", "statistical modeling"]):
                inferred_role = "Data Scientist"
            elif any(k in text_lower for k in ["bi analyst", "power bi", "tableau", "dashboard"]):
                inferred_role = "BI Analyst"
            else:
                inferred_role = "Data Analyst"
            domain_label = "Data & Analytics"

        return {
            "inferred_domain": domain_label,
            "inferred_target_role": inferred_role,
            "confidence": round(confidence, 2),
            "domain_scores": scores
        }

