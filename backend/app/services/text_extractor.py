import re
from pathlib import Path
import pymupdf as fitz
import docx

class TextExtractor:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Replace common ligatures
        ligatures = {
            "ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl",
            "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-"
        }
        for k, v in ligatures.items():
            text = text.replace(k, v)

        # Replace non-breaking spaces and weird bullets with standard characters
        text = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219\u25CB\u25CF\uF0A7\uF0B7\uF0D8]', '\n- ', text)
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Fix line-wrap hyphenation and spaced OCR/PDF hyphens (e.g., 'clus- tering' -> 'clustering', 'emer- gency' -> 'emergency')
        text = re.sub(r'(\b[a-zA-Z]{2,})-\s+(?:(?=\n)|(?=[a-z]{2,}))([a-z]+)\b', r'\1\2', text)
        text = re.sub(r'(\b[a-zA-Z]{2,})-\n\s*([a-z]+)\b', r'\1\2', text)
        
        # Fix wrapped emails in narrow columns (e.g., 'user@gmail.\ncom' -> 'user@gmail.com')
        text = re.sub(r'([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.)\s*\n\s*([A-Za-z]{2,7})\b', r'\1\2', text)
        
        # Fix broken superscripts from OCR (e.g., '10\nth' -> '10th', '12\nth' -> '12th')
        text = re.sub(r'(\b\d{1,2})\s*\n\s*(th|st|nd|rd)\b', r'\1\2', text, flags=re.IGNORECASE)
        
        # Fix common OCR typos in academic keywords
        text = re.sub(r'\bpersuing\b', 'pursuing', text, flags=re.IGNORECASE)

        # Remove consecutive blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @staticmethod
    def extract_from_pdf(file_path: str | Path) -> str:
        doc = fitz.open(str(file_path))
        extracted_pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            if page_text:
                extracted_pages.append(page_text)
        doc.close()
        raw_text = "\n".join(extracted_pages)
        return TextExtractor.clean_text(raw_text)

    @staticmethod
    def extract_from_docx(file_path: str | Path) -> str:
        doc = docx.Document(str(file_path))
        paragraphs = []
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs.append(p.text.strip())

        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    paragraphs.append(" | ".join(row_text))

        raw_text = "\n".join(paragraphs)
        return TextExtractor.clean_text(raw_text)

    @classmethod
    def extract_text(cls, file_path: str | Path) -> str:
        path = Path(file_path)
        ext = path.suffix.lower()
        if ext == ".pdf":
            return cls.extract_from_pdf(path)
        elif ext in [".docx", ".doc"]:
            return cls.extract_from_docx(path)
        else:
            raise ValueError(f"Unsupported file format: {ext}. Only PDF and DOCX are supported.")
