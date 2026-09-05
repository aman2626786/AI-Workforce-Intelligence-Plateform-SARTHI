"""
TextCleaner:
Cleans and normalizes Job Description text before NLP extraction:
- Unescapes HTML entities (&nbsp;, &amp;, &lt;, etc.)
- Strips HTML tags while preserving line breaks and structural spacing
- Normalizes unicode whitespace and strange punctuation
- Preserves casing and sentence boundaries for accurate offset tracking
"""

import re
import html
from typing import Tuple

class TextCleaner:
    def __init__(self):
        # Regex to strip unwanted HTML tags while keeping line breaks
        self._tag_re = re.compile(r'<br\s*/?>|</p>|</div>|</li>', re.IGNORECASE)
        self._all_tags_re = re.compile(r'<[^>]+>')
        self._whitespace_re = re.compile(r'[ \t\f\v]+')
        self._newlines_re = re.compile(r'\r\n|\r')
        self._multi_newlines_re = re.compile(r'\n{3,}')
        # Common bullet point unicode characters
        self._bullets_re = re.compile(r'[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u2013\u2014*•-]')

    def clean(self, raw_text: str) -> str:
        """
        Cleans the input text, removing HTML, fixing encoding, and normalizing whitespace.
        """
        if not raw_text or not isinstance(raw_text, str):
            return ""

        # 1. Unescape HTML entities
        text = html.unescape(raw_text)

        # 2. Replace block breaks with newlines before stripping all tags
        text = self._tag_re.sub('\n', text)
        text = self._all_tags_re.sub(' ', text)

        # 3. Normalize newline conventions
        text = self._newlines_re.sub('\n', text)

        # 4. Normalize spaces per line
        lines = []
        for line in text.split('\n'):
            cleaned_line = self._whitespace_re.sub(' ', line).strip()
            if cleaned_line:
                lines.append(cleaned_line)

        # Reconstruct text with single newlines
        cleaned_text = '\n'.join(lines)
        return cleaned_text

    def extract_sentences_with_spans(self, text: str):
        """
        Splits text into sentences or bullet points while tracking character offsets.
        Yields (sentence_text, start_offset, end_offset).
        """
        if not text:
            return

        # Split by newlines or sentence boundaries (.!?)
        pattern = re.compile(r'([^\n.!?]+(?:[\n.!?]+|$))')
        for match in pattern.finditer(text):
            chunk = match.group(0).strip()
            if len(chunk) > 3:
                start = match.start()
                end = start + len(chunk)
                yield chunk, start, end
