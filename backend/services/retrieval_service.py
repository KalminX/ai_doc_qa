import logging
from pgvector.django import CosineDistance
from services.embedding_service import get_question_embedding

logger = logging.getLogger("doc_qa.retrieval")

DEFAULT_TOP_K = 5
BROAD_TOP_K = 10

def expand_query_intent(question: str) -> tuple[str, int]:
    """
    Detect if question is a broad conceptual/chapter explanation request.
    Returns (search_query, recommended_top_k).
    """
    q_lower = question.lower()
    broad_keywords = ["explain", "chapter", "overview", "summary", "summarize", "key points", "main ideas", "book"]

    is_broad = any(kw in q_lower for kw in broad_keywords)
    if is_broad:
        # Expand search query to match deeper conceptual lesson chunks
        expanded = f"{question} core concepts definitions rules formulas methods summary"
        return expanded, BROAD_TOP_K
    
    return question, DEFAULT_TOP_K

def retrieve_relevant_chunks(
    question: str,
    user,
    document_ids: list[int] | None = None,
    top_k: int | None = None,
) -> list[dict]:
    """
    1. Detect query intent & expand search query if needed
    2. Embed user question via gemini-embedding-001
    3. Perform CosineDistance search in pgvector
    4. Return top-k chunk dicts with similarity scores
    """
    from documents.models import DocumentChunk

    search_query, adaptive_k = expand_query_intent(question)
    final_k = top_k if top_k is not None else adaptive_k

    user_tier = "free"
    if hasattr(user, "profile"):
        user_tier = user.profile.tier

    logger.info(f"Retrieving top {final_k} vector chunks for user '{user.username}' [{user_tier.upper()}]: '{search_query[:50]}...'")

    question_vector = get_question_embedding(search_query, user_tier=user_tier)

    queryset = DocumentChunk.objects.filter(
        document__user=user,
        embedding__isnull=False,
    )

    if document_ids:
        queryset = queryset.filter(document_id__in=document_ids)

    results = (
        queryset
        .annotate(distance=CosineDistance("embedding", question_vector))
        .order_by("distance")[:final_k]
        .select_related("document")
    )

    chunks = []
    for r in results:
        similarity = max(0.0, round(1.0 - float(r.distance), 4))
        chunks.append({
            "chunk_id": r.id,
            "document_id": r.document_id,
            "document_name": r.document.filename,
            "page_number": r.page_number,
            "content": r.content,
            "similarity_score": similarity,
        })

    logger.info(f"Retrieved {len(chunks)} chunks with similarity scores ranging from {chunks[0]['similarity_score']*100:.1f}% to {chunks[-1]['similarity_score']*100:.1f}%" if chunks else "No chunks retrieved.")
    return chunks
