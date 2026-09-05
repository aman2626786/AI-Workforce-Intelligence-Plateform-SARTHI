import pytest
from backend.app.services.skill_intelligence.text_cleaner import TextCleaner
from backend.app.services.skill_intelligence.section_detector import SectionDetector
from backend.app.services.skill_intelligence.normalizer import SkillNormalizer
from backend.app.services.skill_intelligence.extractor import SkillExtractor
from backend.app.services.skill_intelligence.role_classifier import RoleClassifier

@pytest.fixture
def test_ontology():
    return {
        "skills": [
            {
                "id": "SKL_PYTHON",
                "canonical_name": "Python",
                "category": "Programming Languages",
                "aliases": ["python", "python3", "python 3", "python programming"]
            },
            {
                "id": "SKL_R",
                "canonical_name": "R",
                "category": "Programming Languages",
                "aliases": ["r", "r programming", "r language"]
            },
            {
                "id": "SKL_GOLANG",
                "canonical_name": "Go",
                "category": "Programming Languages",
                "aliases": ["go", "golang", "go programming"]
            },
            {
                "id": "SKL_REACT",
                "canonical_name": "React",
                "category": "Web Frameworks",
                "aliases": ["react", "react.js", "reactjs"]
            }
        ]
    }

@pytest.fixture
def test_taxonomy():
    return {
        "families": [{"id": "FAM_DATA", "name": "Data & Analytics", "code": "DATA"}],
        "roles": [
            {
                "id": "ROL_DATA_SCIENTIST",
                "family_id": "FAM_DATA",
                "name": "Data Scientist",
                "code": "DATA_SCIENTIST",
                "aliases": ["data scientist", "senior data scientist"],
                "queries": ["data science", "machine learning"]
            }
        ]
    }

def test_text_cleaner():
    cleaner = TextCleaner()
    html = "<div><p>Required Skills:</p><ul><li>Python 3</li><li>React.js</li></ul></div>"
    cleaned = cleaner.clean(html)
    assert "Required Skills:" in cleaned
    assert "Python 3" in cleaned
    assert "React.js" in cleaned
    assert "<" not in cleaned

def test_section_detector():
    detector = SectionDetector()
    text = "Responsibilities:\nLead the team.\nRequirements:\nMust have Python.\nNice to Have:\nReact."
    sections = detector.detect_sections(text)
    
    assert len(sections) == 3
    assert sections[0]["section"] == "RESPONSIBILITIES"
    assert sections[1]["section"] == "REQUIRED"
    assert sections[2]["section"] == "PREFERRED"
    
    assert detector.classify_requirement_type("REQUIRED", "Python experience") == "REQUIRED"
    assert detector.classify_requirement_type("RESPONSIBILITIES", "Experience with AWS is a plus") == "PREFERRED"

def test_normalizer(test_ontology):
    normalizer = SkillNormalizer(test_ontology)
    
    # Exact
    skill, conf, meth = normalizer.normalize("Python")
    assert skill["id"] == "SKL_PYTHON"
    
    # Alias stripped
    skill, conf, meth = normalizer.normalize("python 3")
    assert skill["id"] == "SKL_PYTHON"
    
    # Punctuation norm
    skill, conf, meth = normalizer.normalize("React-JS")
    assert skill["id"] == "SKL_REACT"

def test_extractor(test_ontology):
    normalizer = SkillNormalizer(test_ontology)
    extractor = SkillExtractor(normalizer)
    
    # Boundary and ambiguity check
    # 'R' isolated should fail, 'R programming' should pass
    res1 = extractor.extract_skills_from_jd("We do R&D here.")
    assert len(res1["skills"]) == 0
    
    res2 = extractor.extract_skills_from_jd("Experience with Python, R, and SQL is required.")
    skill_ids = [s["skill_id"] for s in res2["skills"]]
    assert "SKL_R" in skill_ids
    assert "SKL_PYTHON" in skill_ids

    # 'go' verb should fail, 'golang' should pass
    res3 = extractor.extract_skills_from_jd("We go to the office.")
    assert len(res3["skills"]) == 0
    
    res4 = extractor.extract_skills_from_jd("Looking for a Golang developer.")
    skill_ids4 = [s["skill_id"] for s in res4["skills"]]
    assert "SKL_GOLANG" in skill_ids4

def test_role_classifier(test_taxonomy):
    classifier = RoleClassifier(test_taxonomy)
    
    # Exact title
    res1 = classifier.classify("Senior Data Scientist")
    assert res1["role_id"] == "ROL_DATA_SCIENTIST"
    assert res1["status"] == "CONFIDENT"
    
    # Keyword overlap
    res2 = classifier.classify("Data Science Engineer")
    assert res2["role_id"] == "ROL_DATA_SCIENTIST"
    assert res2["status"] == "CONFIDENT"
    
    # Low confidence fallback
    res3 = classifier.classify("Office Manager")
    assert res3["role_id"] is None
    assert res3["status"] == "LOW_CONFIDENCE"
