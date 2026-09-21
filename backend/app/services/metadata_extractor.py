import re
import json
import urllib.parse
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

class MetadataExtractor:
    def __init__(self):
        self._skills_cache: Optional[List[Dict[str, Any]]] = None

    def _load_skills(self) -> List[Dict[str, Any]]:
        if self._skills_cache is None:
            skills_file = DATA_DIR / "skills.json"
            if skills_file.exists():
                with open(skills_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._skills_cache = [
                        {"name": item["name"], "category": item.get("category", "General"), "aliases": item.get("aliases", [])}
                        for item in data.values()
                    ]
            else:
                self._skills_cache = []
        return self._skills_cache

    def detect_skills_in_text(self, text: str) -> List[str]:
        if not text:
            return []
        lower_text = " " + re.sub(r"[^\w\s+#.-]", " ", text.lower()) + " "
        skills_list = self._load_skills()
        detected = set()

        for s in skills_list:
            canonical = s["name"]
            # Check canonical name surrounded by non-word boundaries
            pattern = rf"(?:\b|\s){re.escape(canonical.lower())}(?:\b|\s)"
            if re.search(pattern, lower_text):
                detected.add(canonical)
                continue
            # Check aliases
            for alias in s.get("aliases", []):
                pattern = rf"(?:\b|\s){re.escape(alias.lower())}(?:\b|\s)"
                if re.search(pattern, lower_text):
                    detected.add(canonical)
                    break

        return sorted(list(detected))[:10]

    async def fetch_metadata(self, url: str) -> Dict[str, Any]:
        # Validate URL schema
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Only http and https protocols are supported.")

        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        title = ""
        description = ""
        thumbnail = ""
        author = ""
        publisher = ""
        published_date = ""

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")

                    # Title extraction
                    og_title = soup.find("meta", property="og:title")
                    twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
                    if og_title and og_title.get("content"):
                        title = og_title["content"].strip()
                    elif twitter_title and twitter_title.get("content"):
                        title = twitter_title["content"].strip()
                    elif soup.title and soup.title.string:
                        title = soup.title.string.strip()

                    # Description extraction
                    og_desc = soup.find("meta", property="og:description")
                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    twitter_desc = soup.find("meta", attrs={"name": "twitter:description"})
                    if og_desc and og_desc.get("content"):
                        description = og_desc["content"].strip()
                    elif meta_desc and meta_desc.get("content"):
                        description = meta_desc["content"].strip()
                    elif twitter_desc and twitter_desc.get("content"):
                        description = twitter_desc["content"].strip()

                    # Thumbnail extraction
                    og_image = soup.find("meta", property="og:image")
                    twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
                    if og_image and og_image.get("content"):
                        thumbnail = urllib.parse.urljoin(url, og_image["content"].strip())
                    elif twitter_image and twitter_image.get("content"):
                        thumbnail = urllib.parse.urljoin(url, twitter_image["content"].strip())

                    # Author extraction
                    meta_author = soup.find("meta", attrs={"name": "author"}) or soup.find("meta", attrs={"name": "citation_author"})
                    if meta_author and meta_author.get("content"):
                        author = meta_author["content"].strip()

                    # Publisher / Site name
                    og_site = soup.find("meta", property="og:site_name")
                    if og_site and og_site.get("content"):
                        publisher = og_site["content"].strip()

                    # Published Date
                    pub_time = soup.find("meta", property="article:published_time") or soup.find("meta", attrs={"name": "citation_publication_date"}) or soup.find("meta", attrs={"name": "date"})
                    if pub_time and pub_time.get("content"):
                        published_date = pub_time["content"].strip()

        except Exception as e:
            # Fallback if page blocks scraping or times out
            pass

        # If title is still empty, derive from URL path
        if not title:
            path_slug = parsed.path.rstrip("/").split("/")[-1]
            title = path_slug.replace("-", " ").replace("_", " ").title() if path_slug else domain

        # Infer source name
        source_name = publisher or domain.split(".")[0].capitalize()
        if "arxiv.org" in domain:
            source_name = "arXiv"
        elif "github.com" in domain:
            source_name = "GitHub"
        elif "medium.com" in domain:
            source_name = "Medium"
        elif "huggingface.co" in domain:
            source_name = "Hugging Face"
        elif "coursera.org" in domain:
            source_name = "Coursera"
        elif "edx.org" in domain:
            source_name = "edX"

        # Inferred Resource Type
        inferred_type = "LEARNING_RESOURCE"
        full_text_sample = f"{title} {description} {url}".lower()
        if "arxiv.org" in domain or "biorxiv.org" in domain or "doi.org" in domain or "paper" in full_text_sample or "proceedings" in full_text_sample:
            inferred_type = "RESEARCH_PAPER"
        elif any(k in full_text_sample for k in ["hackathon", "internship", "fellowship", "scholarship", "grant", "competition", "contest"]):
            inferred_type = "OPPORTUNITY"
        elif any(k in domain for k in ["techcrunch.com", "theverge.com", "news.ycombinator.com", "wired.com"]) or any(k in full_text_sample for k in ["announces", "workforce", "hiring trends", "market report", "layoffs"]):
            inferred_type = "INDUSTRY_NEWS"
        elif any(k in full_text_sample for k in ["release", "update", "v1.", "v2.", "v3.", "changelog", "announced", "benchmark"]):
            inferred_type = "TECH_UPDATE"

        # Detect skills from title and description
        detected_skills = self.detect_skills_in_text(f"{title} {description}")

        # Tags and keywords
        tags = detected_skills[:5]
        keywords = [word.lower() for word in re.findall(r"\b[a-zA-Z]{3,15}\b", f"{title} {description}") if word.lower() not in {"this", "with", "from", "that", "have", "more", "will", "what", "their"}]
        keywords = list(dict.fromkeys(keywords))[:8]

        return {
            "title": title,
            "description": description or f"Resource discovered from {domain}. Explore original documentation and guides.",
            "source_name": source_name,
            "source_domain": domain,
            "author": author,
            "publisher": publisher or source_name,
            "published_date": published_date,
            "thumbnail_url": thumbnail,
            "inferred_type": inferred_type,
            "inferred_category": "Research" if inferred_type == "RESEARCH_PAPER" else ("Career" if inferred_type == "OPPORTUNITY" else "Technology"),
            "detected_skills": detected_skills,
            "tags": tags,
            "keywords": keywords,
        }

metadata_extractor = MetadataExtractor()
