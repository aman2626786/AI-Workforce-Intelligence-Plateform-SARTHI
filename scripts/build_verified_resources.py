import re
import json
import urllib.parse
from datetime import datetime
import os
import sys

def parse_date(date_str):
    if not date_str:
        return "2026-07-20T00:00:00.000Z"
    cleaned = re.sub(r'[📅📝Published:\*]', '', date_str).strip()
    
    formats = [
        "%d %B %Y",       # 19 July 2026
        "%B %d, %Y",      # October 21, 2024
        "%d %b %Y",       # 19 Jul 2026
        "%Y-%m-%d",       # 2026-07-19
        "%d/%m/%Y",       # 19/07/2026
        "%m/%d/%Y",       # 07/19/2026
        "%b %d, %Y",      # Oct 21, 2024
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.strftime("%Y-%m-%dT00:00:00.000Z")
        except ValueError:
            pass
    return "2026-07-20T00:00:00.000Z"

def extract_domain(url):
    try:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc.replace("www.", "")
        return netloc if netloc else "matchskill.ai"
    except Exception:
        return "matchskill.ai"

def extract_source_name(domain, url=""):
    d = domain.lower()
    u = url.lower()
    if "github.com" in d:
        parts = [p for p in u.split("github.com/")[-1].split("/") if p]
        if parts:
            return f"GitHub ({parts[0]})"
        return "GitHub"
    if "arxiv.org" in d: return "arXiv Research"
    if "huggingface.co" in d: return "Hugging Face"
    if "reuters.com" in d: return "Reuters"
    if "osfi-bsif.gc.ca" in d: return "OSFI Canada"
    if "bloomberg.com" in d: return "Bloomberg"
    if "techcrunch.com" in d: return "TechCrunch"
    if "openai.com" in d: return "OpenAI"
    if "google.com" in d or "deepmind" in d: return "Google DeepMind"
    if "microsoft.com" in d: return "Microsoft Research"
    if "anthropic.com" in d: return "Anthropic"
    if "medium.com" in d: return "Medium"
    if "nature.com" in d: return "Nature"
    if "kaggle.com" in d: return "Kaggle"
    if "leetcode.com" in d: return "LeetCode"
    if "wsj.com" in d: return "Wall Street Journal"
    if "ft.com" in d: return "Financial Times"
    if "theverge.com" in d: return "The Verge"
    if "wired.com" in d: return "WIRED"
    if "investing.com" in d: return "Investing.com"
    if "hkexnews.hk" in d: return "Hong Kong Exchange"
    
    parts = d.split(".")
    if len(parts) >= 2:
        return parts[-2].capitalize()
    return "MatchSkill Editorial"

def infer_category(title, content, r_type):
    combined = (title + " " + content).lower()
    if r_type == 'RESEARCH_PAPER':
        if any(w in combined for w in ['speech', 'voice', 'audio', 'whisper', 'transcription', 'acoustic', 'sound']):
            return "Audio & Speech AI"
        if any(w in combined for w in ['vision', 'video', 'image', 'diffusion', 'multimodal', 'yolo', 'segmentation', 'pixel']):
            return "Computer Vision & Multimodal"
        if any(w in combined for w in ['agent', 'reasoning', 'planning', 'mcp', 'tool-use', 'autonomous', 'crewai', 'langchain']):
            return "Autonomous AI Agents"
        if any(w in combined for w in ['reinforcement', 'rl', 'policy', 'q-learning', 'ppo', 'reward']):
            return "Reinforcement Learning"
        if any(w in combined for w in ['quantum', 'hardware', 'gpu', 'tpu', 'chip', 'cuda', 'fp8', 'quantization', 'latency']):
            return "AI Systems & Hardware"
        return "Advanced AI Research"
    elif r_type == 'INDUSTRY_NEWS':
        if any(w in combined for w in ['regulat', 'osfi', 'risk', 'security', 'govern', 'compliance', 'cyber', 'law', 'eu ai act', 'deepfake', 'safety']):
            return "AI Governance & Policy"
        if any(w in combined for w in ['layoff', 'restructur', 'hir', 'workforce', 'talent', 'salaries', 'job', 'engineer', 'salary']):
            return "Tech Labor & Workforce"
        if any(w in combined for w in ['funding', 'acquisition', 'billion', 'million', 'ipo', 'startup', 'invest', 'venture', 'revenue']):
            return "Venture & Market Dynamics"
        if any(w in combined for w in ['chip', 'datacenter', 'semiconductor', 'nvidia', 'amd', 'intel', 'energy', 'power']):
            return "Semiconductors & Infrastructure"
        return "Industry Tech News"
    else: # LEARNING_RESOURCE
        if any(w in combined for w in ['reinforcement', 'rl', 'q-learning']):
            return "Reinforcement Learning"
        if any(w in combined for w in ['system design', 'architecture', 'distributed', 'microservice', 'scalab']):
            return "Systems & Architecture"
        if any(w in combined for w in ['deep learning', 'neural', 'pytorch', 'tensorflow', 'drizzle', 'math']):
            return "Deep Learning Foundations"
        if any(w in combined for w in ['data science', 'pandas', 'analytics', 'statistics', 'numpy', 'scikit']):
            return "Data Science & Analytics"
        if any(w in combined for w in ['full stack', 'react', 'next.js', 'typescript', 'backend', 'api', 'fastapi']):
            return "Full-Stack Development"
        return "Engineering Guides"

def infer_skills(title, content, tags):
    combined = (title + " " + content + " " + " ".join(tags)).lower()
    known = [
        "Python", "PyTorch", "TensorFlow", "Transformers", "NLP", "LLMs", "RAG",
        "Reinforcement Learning", "Deep Learning", "Computer Vision", "Speech Recognition",
        "Agentic AI", "Docker", "Kubernetes", "FastAPI", "SQL", "TypeScript", "Next.js",
        "MLOps", "Microservices", "System Design", "Cloud Computing", "AI Security",
        "Model Optimization", "Prompt Engineering", "Fine-Tuning", "Distributed Systems"
    ]
    detected = []
    for k in known:
        if k.lower() in combined:
            detected.append(k)
    if not detected:
        detected = ["Artificial Intelligence", "Machine Learning"]
    return detected[:5]

def format_links_as_markdown(text):
    def replace_link(match):
        label = match.group(1).strip()
        url = match.group(2).strip().rstrip('.,;:)')
        if 'chat.whatsapp.com' in url or 'whatsapp.com' in url:
            return ""
        if not label or label.lower() in ['link', 'url', 'source', 'resource']:
            label = "View Official Resource"
        label = re.sub(r'^[•\-\*📂🔗\s]+', '', label).strip()
        return f"- [{label}]({url})"

    text = re.sub(r'(?:[•\-\*📂🔗]\s*)?([^:\n]+):\s*(https?://[^\s\)]+)', replace_link, text)
    return text

def parse_file(filepath, resource_type, existing_slugs):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    header_pattern = r'\[\d{1,2}/\d{1,2}/\d{2,4},\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM)\]\s+([^:\n]+):\s*'
    matches = list(re.finditer(header_pattern, text))
    
    items = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        raw_msg = text[start:end].strip()
        
        # Filter noise
        if '━━━━━━━━━━━━━━' not in raw_msg and 'http' not in raw_msg:
            continue
            
        all_lines = [line.strip() for line in raw_msg.split('\n')]
        
        # Filter out WhatsApp meta lines
        clean_lines = []
        for line in all_lines:
            if 'chat.whatsapp.com' in line:
                continue
            if 'Shared by NextGen Data Minds' in line:
                continue
            if 'Join our community' in line:
                continue
            if 'Messages and calls are end-to-end encrypted' in line:
                continue
            if 'joined via invite link' in line:
                continue
            if 'System notification' in line:
                continue
            if re.search(r'\[\d{1,2}/\d{1,2}/\d{2,4}.*?\]', line):
                continue
            clean_lines.append(line)
            
        if not clean_lines:
            continue
            
        # Extract date
        date_str = None
        for line in clean_lines[:10]:
            if '📅' in line or 'Published:' in line:
                date_str = line
                break
        published_at = parse_date(date_str)
        
        # Find True Title
        # Exclude boilerplate lines
        title = None
        for line in clean_lines:
            if not line:
                continue
            if any(marker in line for marker in ['Industry News |', 'Learning Resource |', 'Research Paper |', '━━━━━━━━━━━━━━', '📅', 'Published:']):
                continue
            # Usually real title starts with an emoji or is bold
            if any(line.startswith(em) for em in [
                '🏦', '🤖', '🎙️', '🧠', '📊', '🚀', '💡', '🔥', '⚡', '📈', '🔬', '🌐', 
                '🛡️', '📦', '🎯', '🚨', '📢', '💻', '🔍', '⚙️', '✨', '🎓', '🏆', '🛠️'
            ]):
                # Remove if title is just "📢 Shared by..."
                if 'Shared by' in line:
                    continue
                title = line
                break
                
        if not title:
            # Fallback: look after first separator
            found_sep = False
            for line in clean_lines:
                if '━━━━━━━━━━━━━━' in line:
                    found_sep = True
                    continue
                if found_sep and line:
                    if not any(marker in line for marker in ['📅', 'Published:', 'Shared by', 'http']):
                        title = line
                        break
                        
        if not title:
            continue
            
        title = re.sub(r'^\*+|\*+$', '', title).strip()
        clean_title = re.sub(r'^[^\w\s]+', '', title).strip()
        if not clean_title:
            clean_title = title
            
        # Extract all URLs (Strictly excluding whatsapp)
        raw_urls = re.findall(r'https?://[^\s)\]]+', "\n".join(clean_lines))
        cleaned_urls = [u.rstrip('.,;:)]') for u in raw_urls if 'whatsapp.com' not in u]
        
        # Determine primary URL
        primary_url = ""
        for u in cleaned_urls:
            if "arxiv.org" in u or "github.com" in u or "huggingface.co" in u:
                primary_url = u
                break
        if not primary_url and cleaned_urls:
            primary_url = cleaned_urls[0]
        if not primary_url:
            primary_url = "https://matchskill.ai/resources"
            
        source_domain = extract_domain(primary_url)
        source_name = extract_source_name(source_domain, primary_url)
        
        # Extract hashtags
        hashtags = [h for h in re.findall(r'#([A-Za-z0-9_]+)', "\n".join(clean_lines)) if h.lower() != 'nextgendataminds']
        
        # Extract short description
        short_desc = ""
        for idx, line in enumerate(clean_lines):
            if any(marker in line for marker in ["📝 What's Happening?", "📝 Paper Summary", "📖 What You'll Learn", "What's Happening?", "Paper Summary", "What's New:"]):
                desc_lines = []
                for sub in clean_lines[idx+1:idx+7]:
                    if '━━━━━━━━━━━━━━' in sub or sub.startswith('✅') or sub.startswith('💡') or sub.startswith('•') or sub.startswith('#') or sub.startswith('###'):
                        break
                    if sub and not sub.startswith('http') and 'chat.whatsapp.com' not in sub:
                        desc_lines.append(sub)
                if desc_lines:
                    short_desc = " ".join(desc_lines)
                    break
                    
        if not short_desc:
            # Look for first substantive paragraph after title
            desc_lines = []
            capture = False
            for line in clean_lines:
                if line == title:
                    capture = True
                    continue
                if capture:
                    if '━━━━━━━━━━━━━━' in line or line.startswith('✅') or line.startswith('💡') or line.startswith('#') or line.startswith('###'):
                        break
                    if line and not line.startswith('http') and 'chat.whatsapp.com' not in line:
                        desc_lines.append(line)
            short_desc = " ".join(desc_lines)
            
        short_desc = re.sub(r'\*+', '', short_desc).strip()
        if len(short_desc) > 280:
            short_desc = short_desc[:277] + "..."
        if not short_desc or len(short_desc) < 15:
            short_desc = f"Authoritative technical breakdown, architecture insights, and verified industry implementation details for {clean_title}."
            
        # Refine content into rich markdown
        content_lines = []
        for line in clean_lines:
            if any(b in line for b in ['NextGen Data Minds', 'Stay Updated', 'Happy Learning!']):
                continue
            if line.startswith('📅') or line == title:
                continue
            if '━━━━━━━━━━━━━━' in line:
                content_lines.append('\n---\n')
                continue
            # Sections
            if any(line.startswith(icon) for icon in ['📝', '💡', '⚠️', '📖', '🎯', '📊', '🚀', '🔍', '🛠️', '🔗', '📂']):
                section_title = re.sub(r'^\*+|\*+$', '', line).strip()
                content_lines.append(f"\n### {section_title}\n")
                continue
            # Bullets
            if line.startswith('•') or line.startswith('✅') or line.startswith('🔹') or line.startswith('-'):
                bullet_content = re.sub(r'^[•✅🔹\-\s]+', '', line).strip()
                bullet_content = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'**\1**', bullet_content)
                content_lines.append(f"- {bullet_content}")
                continue
            converted = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'**\1**', line)
            content_lines.append(converted)
            
        raw_markdown = "\n".join(content_lines).strip()
        raw_markdown = format_links_as_markdown(raw_markdown)
        content_markdown = f"# {title}\n\n## {short_desc}\n\n" + raw_markdown
        
        category = infer_category(title, raw_msg, resource_type)
        tags = [category] + hashtags[:4]
        skills = infer_skills(title, raw_msg, tags)
        
        base_slug = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')[:55]
        if not base_slug:
            base_slug = f"resource-{resource_type.lower()}"
        slug = base_slug
        count_dup = 1
        while slug in existing_slugs:
            count_dup += 1
            slug = f"{base_slug}-{count_dup}"
        existing_slugs.add(slug)
        
        item_id = f"res-{resource_type.lower()[:4]}-{len(existing_slugs)}"
        
        item = {
            "id": item_id,
            "title": title,
            "slug": slug,
            "resource_type": resource_type,
            "short_description": short_desc,
            "content_summary": short_desc,
            "content_markdown": content_markdown,
            "original_url": primary_url,
            "source_name": source_name,
            "source_domain": source_domain,
            "author": "NextGen Intelligence Labs",
            "organization": source_name,
            "publisher": source_name,
            "published_at": published_at,
            "language": "en",
            "difficulty": "Intermediate" if resource_type == 'RESEARCH_PAPER' else "All Levels",
            "category": category,
            "tags": tags,
            "hashtags": hashtags,
            "keywords": list(set(tags + skills)),
            "skills": skills,
            "target_roles": ["AI Engineer", "Machine Learning Engineer", "Data Scientist", "Full Stack Engineer"],
            "is_verified": True,
            "verification_status": "VERIFIED",
            "view_count": 0,
            "like_count": 0,
            "save_count": 0,
            "share_count": 0,
            "comment_count": 0,
            "status": "PUBLISHED",
            "created_at": published_at,
            "updated_at": published_at
        }
        items.append(item)
    return items

def main():
    existing_slugs = set()
    print("Parsing Industry News...")
    news = parse_file(r'E:\Sarthi\industrynews_raw.txt', 'INDUSTRY_NEWS', existing_slugs)
    print(f"-> Parsed {len(news)} Industry News items.")

    print("Parsing Learning Resources...")
    learning = parse_file(r'E:\Sarthi\learningresources_raw.txt', 'LEARNING_RESOURCE', existing_slugs)
    print(f"-> Parsed {len(learning)} Learning Resources items.")

    print("Parsing Research Papers...")
    research = parse_file(r'E:\Sarthi\researchpapers_raw.txt', 'RESEARCH_PAPER', existing_slugs)
    print(f"-> Parsed {len(research)} Research Papers items.")

    all_resources = news + learning + research
    print(f"\nTotal Resources Compiled: {len(all_resources)}")

    catalog_data = {
        "total": len(all_resources),
        "page": 1,
        "page_size": 20,
        "total_pages": max(1, (len(all_resources) + 19) // 20),
        "resources": all_resources
    }

    output_path = r'E:\Sarthi\src\data\fallbackResources.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully written {len(all_resources)} refined resources to {output_path}")

if __name__ == '__main__':
    main()
