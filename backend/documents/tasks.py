import threading
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger("doc_qa.tasks")

from celery import shared_task

def process_document_async(document_id: int):
    # Dispatch to celery instead of thread
    _process_document.delay(document_id)


def send_ws_progress(document_id: int, status: str, stage: str, progress: int, message: str, processed_chunks: int = 0, total_chunks: int = 0, tier: str = "free"):
    """Broadcast real-time document indexing progress to WebSocket subscribers."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"doc_{document_id}",
                {
                    "type": "indexing_progress",
                    "document_id": document_id,
                    "status": status,
                    "stage": stage,
                    "progress": progress,
                    "message": message,
                    "processed_chunks": processed_chunks,
                    "total_chunks": total_chunks,
                    "tier": tier,
                }
            )
    except Exception as e:
        logger.warning(f"Could not send WebSocket progress for doc {document_id}: {e}")

@shared_task
def _process_document(document_id: int):
    from documents.models import Document
    from services.pdf_service import extract_text
    from services.chunking_service import chunk_document
    from services.embedding_service import generate_and_store_embeddings

    try:
        doc = Document.objects.select_related("user", "user__profile").get(id=document_id)
        doc.status = Document.Status.PROCESSING
        doc.save(update_fields=["status"])

        # Determine user tier
        is_pro_tier = False
        user_tier = "free"
        if hasattr(doc.user, "profile"):
            user_tier = doc.user.profile.tier
            is_pro_tier = (user_tier == "pro")

        tier_name = "PRO (Blazing Speed)" if is_pro_tier else "FREE (Paced)"
        logger.info(f"Started [{tier_name}] indexing pipeline for Document ID {doc.id} ('{doc.filename}')")

        send_ws_progress(
            document_id=doc.id,
            status="processing",
            stage="extraction",
            progress=10,
            message="Extracting PDF text pages...",
            tier=user_tier,
        )

        # Step 1: Extract PDF text
        pages = extract_text(doc.file.path)
        doc.page_count = len(pages)
        doc.save(update_fields=["page_count"])

        if not pages:
            raise ValueError("No readable text could be extracted from this PDF file.")

        # Synthesize clean, neat document title using Gemini LLM
        sample_text = pages[0]["text"] if pages else ""
        try:
            from services.gemini_service import clean_document_title
            clean_title = clean_document_title(doc.filename, sample_text, user_tier)
            if clean_title and clean_title != doc.filename:
                doc.title = clean_title
                doc.save(update_fields=["title"])
                logger.info(f"Gemini auto-renamed Document ID {doc.id}: '{doc.filename}' -> '{clean_title}'")
        except Exception as title_err:
            logger.warning(f"Failed to auto-clean title for Document ID {doc.id}: {title_err}")

        send_ws_progress(
            document_id=doc.id,
            status="processing",
            stage="chunking",
            progress=25,
            message=f"Extracted {len(pages)} pages. Splitting into overlapping text chunks...",
            tier=user_tier,
        )


        # Step 2: Split text into chunks
        chunks = chunk_document(doc, pages)
        total_chunks = len(chunks)

        send_ws_progress(
            document_id=doc.id,
            status="processing",
            stage="embedding",
            progress=30,
            message=f"Generated {total_chunks} chunks. Embedding via Gemini vectors [{tier_name}]...",
            processed_chunks=0,
            total_chunks=total_chunks,
            tier=user_tier,
        )

        # Progress callback for batch embedding
        def on_embedding_progress(processed_count, total_count, batch_num, total_batches):
            percent = 30 + int((processed_count / total_count) * 65)  # 30% to 95%
            send_ws_progress(
                document_id=doc.id,
                status="processing",
                stage="embedding",
                progress=percent,
                message=f"Embedding batch {batch_num}/{total_batches} ({processed_count}/{total_count} chunks) [{tier_name}]",
                processed_chunks=processed_count,
                total_chunks=total_count,
                tier=user_tier,
            )

        # Step 3: Generate embeddings (tier-sensitive delay & batching)
        generate_and_store_embeddings(chunks, is_pro_tier=is_pro_tier, progress_callback=on_embedding_progress)

        doc.status = Document.Status.INDEXED
        doc.error_message = ""
        doc.save(update_fields=["status", "error_message"])

        send_ws_progress(
            document_id=doc.id,
            status="indexed",
            stage="complete",
            progress=100,
            message=f"Indexing complete! {total_chunks} text chunks ready for Q&A.",
            processed_chunks=total_chunks,
            total_chunks=total_chunks,
            tier=user_tier,
        )
        logger.info(f"Document ID {doc.id} ('{doc.filename}') indexed successfully [{tier_name}].")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Indexing pipeline failed for Document ID {document_id}: {error_msg}")
        try:
            doc = Document.objects.get(id=document_id)
            doc.status = Document.Status.FAILED
            doc.error_message = error_msg
            doc.save(update_fields=["status", "error_message"])
            send_ws_progress(
                document_id=document_id,
                status="failed",
                stage="failed",
                progress=0,
                message=f"Indexing failed: {error_msg}",
            )
        except Exception as save_err:
            logger.error(f"Failed to update document status to FAILED: {save_err}")
