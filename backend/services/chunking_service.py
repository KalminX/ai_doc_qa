import logging

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1000       # characters
CHUNK_OVERLAP = 200     # characters

def chunk_document(document, pages: list[dict]):
    """
    Split extracted document page text into overlapping chunks.
    Preserves page number for metadata tracking.
    """
    from documents.models import DocumentChunk

    chunks_to_create = []

    for page_data in pages:
        page_num = page_data["page_number"]
        text = page_data["text"]

        if len(text) <= CHUNK_SIZE:
            chunks_to_create.append(
                DocumentChunk(
                    document=document,
                    content=text,
                    page_number=page_num,
                )
            )
        else:
            start = 0
            while start < len(text):
                end = start + CHUNK_SIZE
                chunk_text = text[start:end]
                chunks_to_create.append(
                    DocumentChunk(
                        document=document,
                        content=chunk_text,
                        page_number=page_num,
                    )
                )
                start += CHUNK_SIZE - CHUNK_OVERLAP

    created_chunks = DocumentChunk.objects.bulk_create(chunks_to_create)
    logger.info(f"Created {len(created_chunks)} chunks for document ID {document.id}")
    return created_chunks
