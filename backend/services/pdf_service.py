import pymupdf  # PyMuPDF engine
import re
import unicodedata
import logging

logger = logging.getLogger("doc_qa.pdf")

# Map of common PDF font ligature glitches to standard characters
LIGATURE_MAP = {
    "ﬀ": "ff",
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "ﬅ": "ft",
    "ﬆ": "st",
    "―": "-",
    "–": "-",
    "—": "-",
}

def extract_text(file_path: str) -> list[dict]:
    """
    Extract text page-by-page from a PDF file using PyMuPDF with clean normalization.
    Returns a list of dicts: [{"page_number": 1, "text": "..."}, ...]
    """
    try:
        doc = pymupdf.open(file_path)
        pages = []
        for page_num, page in enumerate(doc, start=1):
            raw_text = page.get_text("text")
            cleaned = clean_text(raw_text)
            if cleaned.strip():
                pages.append({
                    "page_number": page_num,
                    "text": cleaned
                })
        doc.close()
        logger.info(f"Successfully extracted {len(pages)} pages from file '{file_path}'")
        return pages
    except Exception as e:
        logger.error(f"Failed to extract text from PDF '{file_path}': {e}", exc_info=True)
        raise ValueError(f"Could not parse PDF file: {str(e)}") from e

def clean_text(text: str) -> str:
    """
    Clean up extracted PDF text while retaining 100% semantic veracity:
    - Normalizes unicode ligatures (ff, fi, fl)
    - Fixes hyphenated line-wrapped words
    - Cleans up orphan control characters and extra spaces
    """
    if not text:
        return ""

    # 1. Normalize unicode NFKC
    text = unicodedata.normalize("NFKC", text)

    # 2. Replace known font ligature glitches
    for lig, replacement in LIGATURE_MAP.items():
        text = text.replace(lig, replacement)

    # 3. Join words split across line breaks with hyphens (e.g. "diﬀer-\nential" -> "differential")
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)

    # 4. Replace multiple newlines with double newlines (paragraph boundaries)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 5. Replace multiple horizontal spaces/tabs with single space
    text = re.sub(r'[ \t]+', ' ', text)

    # 6. Trim each line cleanly
    lines = [line.strip() for line in text.split('\n')]
    cleaned = '\n'.join(lines).strip()

    return cleaned
