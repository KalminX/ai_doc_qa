import logging
import time
from django.conf import settings
from google import genai
from google.genai import types
from google.genai import errors

logger = logging.getLogger("doc_qa.gemini")

RAG_SYSTEM_PROMPT = """You are an expert instructional tutor and document analyst. Your job is to deliver clear, deep, educational explanations based strictly on the provided document context.

Instructional Rules:
1. Synthesize concepts, definitions, rules, formulas, and examples from the provided context. Do NOT simply list section headings or table-of-contents titles.
2. When asked to "explain" a chapter or topic, break down the underlying mathematical or technical principles, core ideas, and key takeaways found in the text.
3. Answer strictly based on the provided document sections below. Do not invent facts not present in the text.
4. If the retrieved context does NOT contain information to answer the question, state: "The provided documents do not contain information to answer this question."
5. Always include clear inline citations (e.g. [Document Name, Page X]) for every key concept or claim.
"""

def generate_answer(question: str, context_chunks: list[dict], user_tier: str = "free", retries: int = 3) -> str:
    """
    Generate RAG answer using Gemini model with tier-specific API key & retry handling.
    """
    if user_tier == "pro":
        api_key = settings.GEMINI_PRO_API_KEY or settings.GEMINI_API_KEY
    else:
        api_key = settings.GEMINI_FREE_API_KEY or settings.GEMINI_API_KEY

    if not api_key or api_key == "your-gemini-api-key-here":
        msg = f"Gemini API key for {user_tier.upper()} tier is not configured in backend/.env"
        logger.error(msg)
        raise ValueError(msg)

    client = genai.Client(api_key=api_key)

    context_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"[Source {i}] Document: '{chunk['document_name']}', Page {chunk['page_number']}\n"
            f"Content: {chunk['content']}\n"
        )
    context_str = "\n---\n".join(context_parts)

    user_prompt = f"""DOCUMENT CONTEXT:
{context_str}

USER QUESTION:
{question}

Provide an instructional, step-by-step explanation grounded in the document context above. Include inline citations (Page numbers) for key facts."""

    for attempt in range(1, retries + 1):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_GENERATION_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=RAG_SYSTEM_PROMPT,
                    temperature=0.3,
                ),
            )
            return response.text
        except (errors.ClientError, errors.ServerError, errors.APIError) as err:
            err_str = str(err)
            if ("503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str) and attempt < retries:
                logger.warning(f"[{user_tier.upper()}] Gemini API server busy ({err_str[:60]}...). Retrying in 3s (Attempt {attempt}/{retries})...")
                time.sleep(3)
                continue
            
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                descriptive_err = f"Gemini API key for {user_tier.upper()} tier is invalid. Please check GEMINI_{user_tier.upper()}_API_KEY in backend/.env"
            elif "QUOTA_EXHAUSTED" in err_str or "429" in err_str:
                descriptive_err = f"Gemini API rate limit or quota exceeded for {user_tier.upper()} tier. Please try again in a few moments."
            elif "503" in err_str or "UNAVAILABLE" in err_str:
                descriptive_err = "Gemini LLM service is temporarily busy (503). Please try again in a moment."
            else:
                descriptive_err = f"Gemini LLM error ({user_tier.upper()} tier): {err.message if hasattr(err, 'message') else str(err)}"
            
            logger.error(f"[Gemini Generation Error - {user_tier.upper()}] {descriptive_err}")
            raise ValueError(descriptive_err) from err
        except Exception as e:
            logger.error(f"Unexpected error in Gemini generate_answer ({user_tier.upper()} tier): {e}", exc_info=True)
            raise ValueError(f"Failed to generate answer from Gemini model: {str(e)}") from e


def generate_answer_stream(question: str, context_chunks: list[dict], user_tier: str = "free"):
    """
    Generator yielding text chunks real-time using Gemini client streaming API.
    """
    if user_tier == "pro":
        api_key = settings.GEMINI_PRO_API_KEY or settings.GEMINI_API_KEY
    else:
        api_key = settings.GEMINI_FREE_API_KEY or settings.GEMINI_API_KEY

    if not api_key or api_key == "your-gemini-api-key-here":
        msg = f"Gemini API key for {user_tier.upper()} tier is not configured in backend/.env"
        logger.error(msg)
        raise ValueError(msg)

    client = genai.Client(api_key=api_key)

    context_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"[Source {i}] Document: '{chunk['document_name']}', Page {chunk['page_number']}\n"
            f"Content: {chunk['content']}\n"
        )
    context_str = "\n---\n".join(context_parts)

    user_prompt = f"""DOCUMENT CONTEXT:
{context_str}

USER QUESTION:
{question}

Provide an instructional, step-by-step explanation grounded in the document context above. Include inline citations (Page numbers) for key facts."""

    try:
        response_stream = client.models.generate_content_stream(
            model=settings.GEMINI_GENERATION_MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=RAG_SYSTEM_PROMPT,
                temperature=0.3,
            ),
        )
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"[Gemini Streaming Error - {user_tier.upper()}] {e}", exc_info=True)
        raise ValueError(f"Gemini Streaming error: {str(e)}") from e


def clean_document_title(raw_filename: str, sample_text: str = "", user_tier: str = "free") -> str:
    """
    Use Gemini LLM to infer a clean, neat title from messy PDF filename & text excerpt.
    """
    if user_tier == "pro":
        api_key = settings.GEMINI_PRO_API_KEY or settings.GEMINI_API_KEY
    else:
        api_key = settings.GEMINI_FREE_API_KEY or settings.GEMINI_API_KEY

    if not api_key or api_key == "your-gemini-api-key-here":
        return raw_filename

    client = genai.Client(api_key=api_key)

    user_prompt = f"""Raw Filename: {raw_filename}
Sample Text Excerpt (First Page):
{sample_text[:1200]}

Synthesize a clean, neat, professional title for this book or document.
Rules:
- Remove file extensions (.pdf, .doc), version codes ('v1', 'final', 'copy'), scan metadata, ISBN numbers, or rubbish hashes.
- Capitalize cleanly as a book title (e.g. 'Precalculus (10th Edition)' or 'Introduction to Perlin Noise').
- Output ONLY the clean title text string. No quotes, markdown formatting, or preamble."""

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_GENERATION_MODEL,
            contents=user_prompt,
        )
        cleaned = response.text.strip().strip('"').strip("'").replace("\n", " ")
        return cleaned if cleaned else raw_filename
    except Exception as e:
        logger.warning(f"Gemini title cleaning warning ({user_tier.upper()} tier): {e}")
        return raw_filename


