import logging
import time
from django.conf import settings
from google import genai
from google.genai import types
from google.genai import errors

logger = logging.getLogger("doc_qa.embedding")

BATCH_SIZE = 50  # Chunks per batch request

def get_genai_client(user_tier: str = "free"):
    """
    Return a GenAI client initialized with the API key corresponding to user_tier ('pro' vs 'free').
    """
    if user_tier == "pro":
        api_key = settings.GEMINI_PRO_API_KEY or settings.GEMINI_API_KEY
        tier_name = "PRO"
    else:
        api_key = settings.GEMINI_FREE_API_KEY or settings.GEMINI_API_KEY
        tier_name = "FREE"

    if not api_key or api_key == "your-gemini-api-key-here":
        msg = f"Gemini API key for {tier_name} tier is not configured. Please set GEMINI_{tier_name}_API_KEY in backend/.env"
        logger.error(msg)
        raise ValueError(msg)

    return genai.Client(api_key=api_key)

def get_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT", user_tier: str = "free") -> list[float]:
    """Generate vector embedding using gemini-embedding-001 for a single text."""
    embeddings = get_batch_embeddings([text], task_type=task_type, user_tier=user_tier)
    return embeddings[0]

def get_batch_embeddings(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT", user_tier: str = "free", retries: int = 6) -> list[list[float]]:
    """
    Generate vector embeddings using gemini-embedding-001 for a batch of texts using tier-specific API key.
    Includes rate limit retry logic with exponential backoff.
    """
    client = get_genai_client(user_tier=user_tier)

    for attempt in range(1, retries + 1):
        try:
            response = client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=settings.EMBEDDING_DIMENSION,  # 768
                ),
            )
            return [e.values for e in response.embeddings]
        except errors.ClientError as ce:
            error_msg = str(ce)
            if "QUOTA_EXHAUSTED" in error_msg or "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                if attempt < retries:
                    wait_time = attempt * 6  # 6s, 12s, 18s backoff
                    logger.warning(f"[{user_tier.upper()}] Gemini API rate limit hit (429). Retrying in {wait_time}s (Attempt {attempt}/{retries})...")
                    time.sleep(wait_time)
                    continue
                else:
                    descriptive_err = f"Gemini API rate limit or quota exceeded for {user_tier.upper()} key. Please check your account quota limits."
            elif "API_KEY_INVALID" in error_msg or "API key not valid" in error_msg:
                descriptive_err = f"Gemini API key for {user_tier.upper()} tier is invalid. Please check GEMINI_{user_tier.upper()}_API_KEY in backend/.env"
            else:
                descriptive_err = f"Gemini Embedding API error ({user_tier.upper()} tier): {ce.message if hasattr(ce, 'message') else str(ce)}"
            logger.error(f"[Gemini Embedding Error - {user_tier.upper()}] {descriptive_err}")
            raise ValueError(descriptive_err) from ce
        except Exception as e:
            logger.error(f"Unexpected error while generating embeddings ({user_tier.upper()} tier): {e}", exc_info=True)
            raise ValueError(f"Failed to generate embedding vectors: {str(e)}") from e

def get_question_embedding(text: str, user_tier: str = "free") -> list[float]:
    """Generate embedding for user search query."""
    return get_embedding(text, task_type="RETRIEVAL_QUERY", user_tier=user_tier)

def generate_and_store_embeddings(chunks, is_pro_tier: bool = False, progress_callback = None):
    """
    Generate embeddings for chunks using tier-specific API key.
    - Pro Tier: Uses GEMINI_PRO_API_KEY with 0.1s delay between batches.
    - Free Tier: Uses GEMINI_FREE_API_KEY with 3.5s delay between batches.
    """
    from documents.models import DocumentChunk

    unembedded = [c for c in chunks if c.embedding is None]
    if not unembedded:
        logger.info("No unembedded chunks found.")
        if progress_callback:
            progress_callback(len(chunks), len(chunks), 1, 1)
        return

    user_tier = "pro" if is_pro_tier else "free"
    total_chunks = len(unembedded)
    total_batches = (total_chunks + BATCH_SIZE - 1) // BATCH_SIZE
    delay = 0.1 if is_pro_tier else 3.5

    tier_label = "PRO (Blazing Speed)" if is_pro_tier else "FREE (Paced)"
    logger.info(f"[{tier_label}] Generating vector embeddings for {total_chunks} chunks using GEMINI_{user_tier.upper()}_API_KEY...")

    for i in range(0, total_chunks, BATCH_SIZE):
        batch_chunks = unembedded[i:i + BATCH_SIZE]
        batch_texts = [c.content for c in batch_chunks]
        batch_num = (i // BATCH_SIZE) + 1

        try:
            vectors = get_batch_embeddings(batch_texts, task_type="RETRIEVAL_DOCUMENT", user_tier=user_tier)
            for chunk, vec in zip(batch_chunks, vectors):
                chunk.embedding = vec
            DocumentChunk.objects.bulk_update(batch_chunks, ["embedding"])

            processed = min(i + BATCH_SIZE, total_chunks)
            logger.info(f"  ✓ [{tier_label}] Batch {batch_num}/{total_batches} complete ({processed}/{total_chunks} chunks)")

            if progress_callback:
                progress_callback(processed, total_chunks, batch_num, total_batches)

            if delay > 0 and i + BATCH_SIZE < total_chunks:
                time.sleep(delay)

        except Exception as e:
            logger.error(f"Failed to generate embeddings for batch {batch_num} ({tier_label}): {e}")
            raise e

    logger.info(f"Successfully saved all {total_chunks} chunk embeddings in PostgreSQL pgvector.")
