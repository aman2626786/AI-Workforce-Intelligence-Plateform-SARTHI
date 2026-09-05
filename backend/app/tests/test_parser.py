import pytest
from pathlib import Path
from backend.app.services.text_extractor import TextExtractor
from backend.app.services.section_detector import SectionDetector
from backend.app.services.skill_normalizer import SkillNormalizer
from backend.app.services.skill_extractor import SkillExtractor
from backend.app.services.conflict_detector import ConflictDetector
from backend.app.services.profile_extractor import ProfileExtractor
from backend.app.services.resume_parser import ResumeParser

SAMPLE_DIR = Path(__file__).resolve().parent.parent.parent / "sample_resumes"

def test_text_extractor_pdf():
    pdf_path = SAMPLE_DIR / "standard_resume.pdf"
    assert pdf_path.exists(), "Standard test resume PDF must exist"
    text = TextExtractor.extract_text(pdf_path)
    assert len(text) > 100
    assert "Yogesh Kumar" in text
    assert "Python" in text
    assert "EDUCATION" in text

def test_text_extractor_docx():
    docx_path = SAMPLE_DIR / "alt_headings_resume.docx"
    assert docx_path.exists(), "Alt headings DOCX must exist"
    text = TextExtractor.extract_text(docx_path)
    assert len(text) > 100
    assert "Priya Sharma" in text
    assert "TECHNICAL EXPERTISE" in text

def test_section_detector_standard_and_alt_headings():
    detector = SectionDetector()

    # Standard PDF
    pdf_text = TextExtractor.extract_text(SAMPLE_DIR / "standard_resume.pdf")
    sections = detector.detect_sections(pdf_text)
    assert "EDUCATION" in sections
    assert "SKILLS" in sections
    assert "EXPERIENCE" in sections
    assert "PROJECTS" in sections
    assert "CERTIFICATIONS" in sections

    # DOCX with alternative headings ("ACADEMIC QUALIFICATIONS", "TECHNICAL EXPERTISE", "WORK HISTORY", "KEY PROJECTS")
    docx_text = TextExtractor.extract_text(SAMPLE_DIR / "alt_headings_resume.docx")
    docx_sections = detector.detect_sections(docx_text)
    assert "EDUCATION" in docx_sections, "ACADEMIC QUALIFICATIONS should normalize to EDUCATION"
    assert "SKILLS" in docx_sections, "TECHNICAL EXPERTISE should normalize to SKILLS"
    assert "EXPERIENCE" in docx_sections, "WORK HISTORY should normalize to EXPERIENCE"
    assert "PROJECTS" in docx_sections, "KEY PROJECTS should normalize to PROJECTS"

def test_skill_normalization_and_aliases():
    normalizer = SkillNormalizer()
    
    # Test normalization of aliases
    ml_norm = normalizer.normalize("ml")
    assert ml_norm is not None
    assert ml_norm[1] == "Machine Learning"
    assert ml_norm[2] == "AI/ML"

    py_norm = normalizer.normalize("python3")
    assert py_norm is not None
    assert py_norm[1] == "Python"

    psql_norm = normalizer.normalize("psql")
    assert psql_norm is not None
    assert psql_norm[1] == "PostgreSQL"

    react_norm = normalizer.normalize("reactjs")
    assert react_norm is not None
    assert react_norm[1] == "React"

def test_skill_extractor_section_awareness():
    extractor = SkillExtractor()
    sections = {
        "SKILLS": "Python, SQL, PostgreSQL, Docker, Power BI",
        "PROJECTS": "Customer Churn Prediction model using Scikit-Learn and XGBoost in Python.",
        "EXPERIENCE": "Intern building ETL pipelines using Pandas and NumPy."
    }

    skills = extractor.extract_all_skills(sections)
    skill_names = [s["canonical_name"] for s in skills]

    # Verify skills found across all sections
    assert "Python" in skill_names
    assert "SQL" in skill_names
    assert "Scikit-Learn" in skill_names
    assert "XGBoost" in skill_names
    assert "Pandas" in skill_names

    # Check evidence & source section retention
    xgb_item = next(s for s in skills if s["canonical_name"] == "XGBoost")
    assert xgb_item["source_section"] == "PROJECTS"
    assert "xgboost" in xgb_item["evidence_text"].lower()

def test_conflict_detector_preserves_user_priority():
    detector = ConflictDetector()
    user_profile_data = {
        "city": "Jaipur",
        "degree": "B.Tech",
        "college": "National Institute of Technology",
        "graduation_year": 2026
    }
    resume_extracted_data = {
        "personal_info": {
            "city": "Bengaluru",  # Discrepancy!
            "email": "test@example.com"
        },
        "education": [
            {
                "degree": "B.Tech",
                "institution": "National Institute of Technology",
                "graduation_year": 2026
            }
        ]
    }

    conflicts = detector.detect_conflicts(user_profile_data, resume_extracted_data)
    assert len(conflicts) == 1
    assert conflicts[0]["field_name"] == "Current City"
    assert conflicts[0]["user_value"] == "Jaipur"
    assert conflicts[0]["resume_value"] == "Bengaluru"
    assert conflicts[0]["resolution"] == "preserved_user_input"

def test_end_to_end_resume_parser():
    parser = ResumeParser()
    pdf_path = SAMPLE_DIR / "conflicting_resume.pdf"

    user_profile = {
        "city": "Jaipur",  # user city differs from resume city "Bengaluru"
        "degree": "B.Tech",
        "college": "Manipal University",
        "graduation_year": 2025
    }

    result = parser.parse_resume(pdf_path, user_profile)
    assert result["parser_version"] == "1.0.0"
    assert len(result["sections_detected"]) >= 3
    assert result["personal_info"]["email"] == "amit.verma@example.com"
    assert len(result["skills"]) >= 5
    assert len(result["conflicts"]) == 1
    assert result["conflicts"][0]["user_value"] == "Jaipur"
    assert result["confidence_summary"]["overall"] > 0.8

def test_multi_project_segmentation_and_tech_extraction():
    extractor = ProfileExtractor()
    projects_raw = """
B100 Intelligence
Python, SQL, Pandas, Scikit-learn, Power BI
• Built a financial intelligence platform using data preprocessing, feature engineering, anomaly detection, clustering, and interactive dashboards for company analysis.
Smart Health Records & Emergency Response
Python, Machine Learning, n8n, Firebase
• Developed an AI-assisted healthcare platform for digital health records with workflow automation and emergency response management.
WhatsApp Chat Analyzer
Python, NLP, Pandas, Streamlit
• Built an NLP-based analytics dashboard for WhatsApp conversations with sentiment analysis, activity tracking, and user interaction insights.
"""
    projects = extractor.extract_projects(projects_raw)
    assert len(projects) == 3, f"Expected 3 projects, but got {len(projects)}"
    
    # Check titles
    assert projects[0]["name"] == "B100 Intelligence"
    assert projects[1]["name"] == "Smart Health Records & Emergency Response"
    assert projects[2]["name"] == "WhatsApp Chat Analyzer"

    # Check descriptions are isolated and not lumped together
    assert "financial intelligence platform" in projects[0]["description"]
    assert "Smart Health Records" not in projects[0]["description"]
    assert "WhatsApp Chat Analyzer" not in projects[0]["description"]

    assert "healthcare platform" in projects[1]["description"]
    assert "WhatsApp conversations" in projects[2]["description"]

    # Check tech stack raw isolation
    assert "Power BI" in projects[0]["tech_raw"]
    assert "Firebase" in projects[1]["tech_raw"]
    assert "Streamlit" in projects[2]["tech_raw"]

def test_text_extractor_dehyphenation():
    raw_hyphenated = "anomaly detection, clus- tering, and emer- gency response. activity track- ing and busi- ness decision-making."
    cleaned = TextExtractor.clean_text(raw_hyphenated)
    assert "clustering" in cleaned
    assert "emergency" in cleaned
    assert "tracking" in cleaned
    assert "business" in cleaned

def test_leadership_section_isolation():
    detector = SectionDetector()
    resume_sample = """
Selected Projects
B100 Intelligence
Python, SQL, Pandas, Scikit-learn, Power BI
- Built financial intelligence platform.

Leadership
NextGen Data Minds 2026 - Present
Founder & Community Lead 900+ Members
- Leading a 13-member core team.
"""
    sections = detector.detect_sections(resume_sample)
    assert "PROJECTS" in sections
    assert "EXPERIENCE" in sections
    assert "NextGen Data Minds" not in sections["PROJECTS"]
    assert "NextGen Data Minds" in sections["EXPERIENCE"]

def test_robust_experience_extraction():
    extractor = ProfileExtractor()
    exp_raw = """
Bold Analytics Apr 2026 – Jun 2026
Data Analyst Intern Remote
• Developed financial analytics workflows involving data cleaning, transformation, exploratory data analysis.
• Prepared analysis-ready datasets and generated financial insights.
DMV CoreTech Dec 2025 – Mar 2026
Data Science Intern Remote
• Developed end-to-end machine learning workflows including data preprocessing.
"""
    exps = extractor.extract_experience(exp_raw)
    assert len(exps) == 2
    assert exps[0]["company"] == "Bold Analytics"
    assert "Data Analyst Intern" in exps[0]["role"]
    assert exps[0]["start_date"] == "Apr 2026"
    assert exps[0]["end_date"] == "Jun 2026"
    assert "financial analytics" in exps[0]["description"]

    assert exps[1]["company"] == "DMV CoreTech"
    assert "Data Science Intern" in exps[1]["role"]
    assert exps[1]["start_date"] == "Dec 2025"
    assert exps[1]["end_date"] == "Mar 2026"

def test_hariom_resume_parsing():
    from unittest.mock import patch
    parser = ResumeParser()
    raw = """Hariom Dhakar
Phone +91-7737718909 Email: harudhakar@gmail.com
LinkedIn: linkedin.com/in/hariomdhakar11 GitHub: github.com/hariom-dhakar
CAREER OBJECTIVE
Aspiring Data Scientist with a strong foundation in Python, Machine Learning, and Data Analysis.
EDUCATION
• Pursuing Bachelor of Technology in Computer Science from Arya College of Engineering & IT, Jaipur with current CGPA 7.70.
• Completed Senior Secondary from Govt. Senior Secondary School, Bhilwara from Rajasthan Board of Secondary Education with 59.20% in 2022.
• Completed Secondary from SVGMS, Bhilwara from Central Board of Secondary Education with 65.60% in 2020.
TECHNICAL SKILLS
Languages & Tools: C, C++, SQL, MongoDB, Javascript, Python
Libraries/Frameworks: NumPy, Pandas, Scikit-learn, Matplotlib, Flask, React, Node.js, Express.js, Tailwind.
Concepts: Machine Learning, Data Visualization, NLP, Data Analysis, OOPS, DSA, REST APIs
Tools: Jupyter Notebook, Github, VS Code, SQL Workbench, Postman
PROJECTS
Resume Screening System — NLP, ML, Python 2024
• Created an automated pipeline using NLP to extract and match skills from resumes with job descriptions, reducing HR
screening time by up to 60%.
Agri-Horticultural Price Predictor — ML, Python, Streamlit 2023
• Developed a ML web app to forecast crop prices using historical data, enabling farmers to make informed selling decisions.
RideHive — Uber Clone (MERN, Socket.IO) 2024
• Built a full-stack Uber-like ride-hailing platform with real-time rider–driver matching, live location tracking, and Socket.IO-based updates.
• Implemented secure JWT authentication, dynamic fare calculation, ride management, and driver availability using MongoDB Atlas.
CERTIFICATIONS
• Python (Basic) Certification – HackerRank
• JavaScript Certification – HackerRank
• Object-Oriented Programming (OOPS) in C++ – Coding Ninjas
• Git & GitHub Fundamentals – Udemy
ACHIEVEMENTS
Solved 500+ Data Structures and Algorithms problems.
Achieved 4-Star rating in Problem Solving on HackerRank."""

    with patch.object(parser.text_extractor, 'extract_text', return_value=parser.text_extractor.clean_text(raw)):
        res = parser.parse_resume("hariom.pdf")

    assert res["personal_info"]["name"] == "Hariom Dhakar"
    assert res["personal_info"]["email"] == "harudhakar@gmail.com"
    assert res["personal_info"]["portfolio"] is None  # Ensures gmail.com was not falsely matched

    # 3 distinct education entries
    assert len(res["education"]) == 3
    assert res["education"][0]["degree"] == "B.Tech"
    assert res["education"][0]["field"] == "Computer Science"
    assert res["education"][0]["cgpa"] == 7.70
    assert res["education"][1]["degree"] == "12th Standard"
    assert res["education"][1]["percentage"] == 59.20
    assert res["education"][2]["degree"] == "10th Standard"
    assert res["education"][2]["percentage"] == 65.60

    # 3 distinct projects
    assert len(res["projects"]) == 3
    assert res["projects"][0]["name"] == "Resume Screening System"
    assert "Python" in res["projects"][0]["technologies"]
    assert res["projects"][1]["name"] == "Agri-Horticultural Price Predictor"
    assert "Streamlit" in res["projects"][1]["technologies"]
    assert "RideHive" in res["projects"][2]["name"]
    assert any(tech in res["projects"][2]["technologies"] for tech in ["MERN Stack", "Socket.IO", "MongoDB"])

    # 4 certifications
    assert len(res["certifications"]) == 4
    assert res["certifications"][0]["issuer"] == "HackerRank"
    assert res["certifications"][2]["issuer"] == "Coding Ninjas"

def test_aman_business_resume_parsing():
    from unittest.mock import patch
    parser = ResumeParser()
    raw = """Aman Sharma
Jaipur, Rajasthan, India | +91-7627047702 | aman2626786@gmail.com
LinkedIn | GitHub | Portfolio
Summary
Engineering student with hands-on experience in entrepreneurship, community building, event management, team leadership.
Core Skills
Business & Growth: Customer Needs Understanding, Market Research, Product Positioning, Community Growth, Business Communication
Leadership & Execution: Team Leadership, Team Coordination, Event Management, Strategic Planning, Initiative Execution, Problem Solving
Communication: Public Speaking, Presentation, Relationship Building, Content Communication, Cross-functional Collaboration
Tools: MS Excel, PowerPoint, Google Workspace, LinkedIn
Experience
DairyWalla 2026 – Present
Co-Founder B2B Dairy Technology Platform
• Worked on product positioning, market research, marketing, and customer-focused communication.
Bold Analytics Apr 2026 – Jun 2026
Data Analyst Intern Remote
• Collaborated with team members to understand business requirements.
DMV CoreTech Dec 2025 – Mar 2026
Data Science Intern Remote
• Worked collaboratively on project requirements.
Leadership & Responsibilities
NextGen Data Minds 2026 – Present
Founder & Community Lead 900+ Members
• Built and lead a 900+ member technology community.
Hackathon 2026
Organizer & Tech Team Lead Event Leadership
• Organized a hackathon and led the technical team.
Achievements
• Runner-Up at Rajasthan DigiFest × TiE Global Hackathon.
Education
Arya College of Engineering & IT, Jaipur 2023 – 2027
B.Tech in Electronics and Communication Engineering CGPA: 7.8"""

    with patch.object(parser.text_extractor, 'extract_text', return_value=parser.text_extractor.clean_text(raw)):
        res = parser.parse_resume("business.pdf")

    assert res["personal_info"]["name"] == "Aman Sharma"
    assert len(res["experience"]) == 5
    assert res["experience"][0]["company"] == "DairyWalla"
    assert "Co-Founder" in res["experience"][0]["role"]
    assert res["experience"][0]["start_date"] == "2026"
    assert res["experience"][0]["end_date"] == "Present"

    # Business skills recognized
    skill_names = [s["canonical_name"] for s in res["skills"]]
    assert "Team Leadership" in skill_names
    assert "Market Research" in skill_names
    assert "PowerPoint" in skill_names

def test_aditya_resume_parsing():
    from unittest.mock import patch
    parser = ResumeParser()
    raw = """ADITYA SRIVASTAVA
Jaipur, India | aditasrivastav107@gmail.com | +91-8290051283 | linkedin.com/in/aditya-srivastava-181202287
PROFESSIONAL SUMMARY
Engineering fresher pursuing a career in web development, with hands-on project experience building web applications. 
Comfortable across Python, C, HTML/CSS/JavaScript, MySQL, and Excel, and have completed a web development 
internship. Strong problem-solving mindset, quick to pick up new tools, and confident presenting work to teams.
SKILLS
Programming Languages: Python, C, HTML5, CSS, JavaScript
Web Technologies: React.js, Node.js, Express.js
Databases & Tools: MySQL, Microsoft Excel, Git/GitHub
Core Strengths: Problem Solving, Public Speaking, Leadership, Adaptability
INTERNSHIPS
Web Development Intern RSWM Ltd., Ringas, Sikar — 2025
• Completed two web development internships focused on building and maintaining web pages.
• Applied HTML5, CSS, and core web development practices in a live organizational setting.
PROJECTS
Personal Portfolio Website HTML, CSS, JavaScript
• Designed and built a personal portfolio website with About, Skills, Projects, and Contact sections.
• Implemented responsive layout and interactive elements using HTML, CSS, and JavaScript.
Student Management System HTML, CSS, JavaScript + MySQL/PHP
• Built a student management system enabling add, update, delete, and search functionality for student records.
• Used PHP and MySQL for backend data handling with HTML, CSS, and JavaScript on the frontend.
EDUCATION
B.Tech, Engineering — Arya College of Engineering & I.T. 2023 – Currently (4th Year)
Average SGPA: 8.05
Higher Secondary (Class 12th) — Central Academy Senior Secondary School 2022 – 2023
Completed with 60%
Secondary (Class 10th) — Central Academy Senior Secondary School 2020 – 2021
Completed with 60.2%
CERTIFICATIONS
• GeeksforGeeks — Soft Skills (Jul 2025)
• GeeksforGeeks — Python (Sep 2025)
LANGUAGES
Hindi, English
INTERESTS
Software Development, Web Page Development, Problem Solving, Photography, Public Speaking, Chess, Traveling, 
Volleyball, Sketching and Drawing, Online Games"""

    with patch.object(parser.text_extractor, 'extract_text', return_value=parser.text_extractor.clean_text(raw)):
        res = parser.parse_resume("aditya.pdf")

    assert res["personal_info"]["name"] == "Aditya Srivastava"
    assert res["personal_info"]["email"] == "aditasrivastav107@gmail.com"
    assert "8290051283" in res["personal_info"]["phone"]
    assert res["personal_info"]["city"] == "Jaipur"

    # 3 distinct education records
    assert len(res["education"]) == 3
    assert res["education"][0]["degree"] == "B.Tech"
    assert res["education"][0]["cgpa"] == 8.05
    assert "Arya College" in res["education"][0]["institution"]
    assert res["education"][1]["degree"] == "12th Standard"
    assert res["education"][1]["percentage"] == 60.0
    assert res["education"][2]["degree"] == "10th Standard"
    assert res["education"][2]["percentage"] == 60.2

    # 2 distinct projects separated with tech stack
    assert len(res["projects"]) == 2
    assert res["projects"][0]["name"] == "Personal Portfolio Website"
    assert any("HTML" in t for t in res["projects"][0]["technologies"])
    assert "JavaScript" in res["projects"][0]["technologies"]
    assert res["projects"][1]["name"] == "Student Management System"
    assert "PHP" in res["projects"][1]["technologies"]
    assert "MySQL" in res["projects"][1]["technologies"]

    # 1 internship
    assert len(res["experience"]) == 1
    assert "Web Development Intern" in res["experience"][0]["role"]
    assert "RSWM Ltd" in res["experience"][0]["company"]
    assert res["experience"][0]["start_date"] == "2025"

    # 2 certifications with GeeksforGeeks issuer and date
    assert len(res["certifications"]) == 2
    assert res["certifications"][0]["issuer"] == "GeeksforGeeks"
    assert res["certifications"][0]["name"] == "Soft Skills"
    assert res["certifications"][0]["date"] == "Jul 2025"
    assert res["certifications"][1]["issuer"] == "GeeksforGeeks"
    assert res["certifications"][1]["name"] == "Python"
    assert res["certifications"][1]["date"] == "Sep 2025"

def test_bhumika_resume_1_parsing():
    from unittest.mock import patch
    parser = ResumeParser()
    raw = """Bhumika Saxena Jaipur, Rajasthan | +91-6350205866 | [bhumikasaxena1407@gmail.com] |
linkedin.com/in/bhumika-saxena-ab72a1397/
Profile
Creative and enthusiastic Social Media professional with experience in social media management, post and video designing,
content creation, and Instagram management. Experienced in managing social media presence for dance events and studios,
along with working as a Social Lead at Next Gen Data Minds. Skilled in creating engaging content, coordinating social media
activities, and maintaining consistent brand presence across platforms.
Education
Arya College of Engineering and IT, Jaipur 2025 – 2029 B.Tech in Information Technology (IT)
Experience
Next Gen Data Minds 2026 – Present Social Lead
3 Months
– Managing social media activities and content planning for the organization.
– Creating and coordinating social media posts, videos, and promotional content.
– Contributing ideas for improving audience engagement and maintaining an active social media presence.
– Coordinating with team members for content creation, publishing, and social media activities.
Dance Events & Studio Social Media 2025 – 2026 Social Media Manager / Content Designer
1 Year
– Managed Instagram presence for choreography events and a dance studio.
– Designed social media posts, reels, videos, and promotional creatives.
– Planned and published content to promote dance events, classes, and studio activities.
– Created engaging visual content while maintaining a consistent social media presence.
Skills
Social Media: Instagram Management, Content Planning, Social Media Management, Audience Engagement Content:
Post Designing, Video Designing, Reels, Promotional Content, Creative Content Other Skills: Team Coordination, Event
Promotion, Communication, Creative Thinking
Activities
• Worked on social media promotion and content creation for choreography and dance events.
• Participated in college activities, technical events, and team-based activities.
• Contributed to content ideas, event promotion, and social media coordination.
Interests
Social Media, Content Creation, Video Editing, Designing, Dance, Events"""

    with patch.object(parser.text_extractor, 'extract_text', return_value=parser.text_extractor.clean_text(raw)):
        res = parser.parse_resume("bhumika1.pdf")

    assert res["personal_info"]["name"] == "Bhumika Saxena"
    assert res["personal_info"]["email"] == "bhumikasaxena1407@gmail.com"
    assert "6350205866" in res["personal_info"]["phone"]
    assert res["personal_info"]["city"] == "Jaipur"

    # Education
    assert len(res["education"]) >= 1
    assert res["education"][0]["degree"] == "B.Tech"
    assert "Arya College" in res["education"][0]["institution"]
    assert res["education"][0]["field"] == "Information Technology"

    # Experience
    assert len(res["experience"]) == 2
    assert res["experience"][0]["company"] == "Next Gen Data Minds"
    assert "Social Lead" in res["experience"][0]["role"]
    assert res["experience"][0]["start_date"] == "2026"
    assert res["experience"][0]["end_date"] == "Present"
    assert "content planning" in res["experience"][0]["description"]

    assert "Dance Events" in res["experience"][1]["company"]
    assert "Social Media Manager" in res["experience"][1]["role"]
    assert res["experience"][1]["start_date"] == "2025"
    assert res["experience"][1]["end_date"] == "2026"

    # Skills
    skill_names = [s["canonical_name"] for s in res["skills"]]
    assert "Instagram Management" in skill_names
    assert "Social Media Management" in skill_names
    assert "Content Creation" in skill_names
    assert "Video Editing" in skill_names

def test_bhumika_resume_2_two_column_parsing():
    from unittest.mock import patch
    parser = ResumeParser()
    raw = """LANGUAGE
Native Hindi
English
PROFILE
I am a 1st year student in Arya College of Engineering and IT (Old) pursuing B.Tech. in Information Technology.
CONTACT ME
bhumikasaxena1407@gmail.com
Jaipur, Rajasthan 302012
EDUCATION
SVM CHILDREN’S ACADEMY, JAIPUR
• 2023 : Passed class 10th with 96%
• 2025 : Passed class 12th with 84%
ARYA COLLEGE OF ENGINEERING AND IT
• 2025 - Present
Pursuing B.Tech. in Information Technology.
SKILLS
Programming Languages: C, C++, Python
Web Development: HTML, CSS, JavaScript
Communication Skills
Teamwork & Collaboration
Cultural Activities (Dance)
BHUMIKA SAXENA
B.Tech. Student
OBJECTIVE
Eager to learn, grow, and contribute to an organization while gaining practical experience in the field of Information Technology."""

    with patch.object(parser.text_extractor, 'extract_text', return_value=parser.text_extractor.clean_text(raw)):
        res = parser.parse_resume("bhumika2.pdf")

    assert res["personal_info"]["name"] == "Bhumika Saxena"
    assert res["personal_info"]["email"] == "bhumikasaxena1407@gmail.com"
    assert res["personal_info"]["city"] == "Jaipur"

    # Education (3 entries: 10th, 12th, B.Tech)
    assert len(res["education"]) == 3
    assert res["education"][0]["degree"] == "10th Standard"
    assert res["education"][0]["percentage"] == 96.0
    assert "svm children" in res["education"][0]["institution"].lower()
    assert res["education"][1]["degree"] == "12th Standard"
    assert res["education"][1]["percentage"] == 84.0
    assert "svm children" in res["education"][1]["institution"].lower()
    assert res["education"][2]["degree"] == "B.Tech"
    assert "arya college" in res["education"][2]["institution"].lower()

    # Skills
    skill_names = [s["canonical_name"] for s in res["skills"]]
    assert "Python" in skill_names
    assert any("HTML" in s for s in skill_names)
    assert "JavaScript" in skill_names
    assert "Teamwork & Collaboration" in skill_names


