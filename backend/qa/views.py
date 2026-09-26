import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import StreamingHttpResponse
import json
from services.retrieval_service import retrieve_relevant_chunks
from services.gemini_service import generate_answer, generate_answer_stream

logger = logging.getLogger("doc_qa.views")

class AskQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        document_id = request.data.get("document_id")
        document_ids = request.data.get("document_ids")

        if not question:
            return Response(
                {"error": "Question field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine user tier
        user_tier = "free"
        if hasattr(request.user, "profile"):
            user_tier = request.user.profile.tier

        # Normalize document_ids filter
        doc_ids_filter = None
        if document_id:
            doc_ids_filter = [int(document_id)]
        elif document_ids and isinstance(document_ids, list):
            doc_ids_filter = [int(d) for d in document_ids]

        try:
            logger.info(f"Processing question from user '{request.user.username}' [{user_tier.upper()}]: '{question[:40]}...'")

            # Step 1: Retrieve top-k relevant vector chunks
            chunks = retrieve_relevant_chunks(
                question=question,
                user=request.user,
                document_ids=doc_ids_filter,
                top_k=5,
            )

            if not chunks:
                logger.info("No matching vector chunks found for user query.")
                return Response({
                    "answer": "The uploaded documents do not contain relevant information to answer this question.",
                    "sources": [],
                })

            # Step 2: Generate answer using Gemini LLM (with tier-specific key)
            answer = generate_answer(question, chunks, user_tier=user_tier)

            # Step 3: Format sources for response
            sources = [
                {
                    "document": c["document_name"],
                    "document_id": c["document_id"],
                    "page": c["page_number"],
                    "text": c["content"][:300],  # truncated text preview
                    "similarity_score": c["similarity_score"],
                }
                for c in chunks
            ]

            logger.info(f"Successfully generated answer for user '{request.user.username}' [{user_tier.upper()}] with {len(sources)} citations.")
            return Response({
                "answer": answer,
                "sources": sources,
            })

        except ValueError as ve:
            logger.error(f"Validation or configuration error: {ve}")
            return Response(
                {"error": str(ve)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error(f"Unhandled exception in AskQuestionView: {e}", exc_info=True)
            return Response(
                {"error": f"Service Error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AskQuestionStreamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        document_id = request.data.get("document_id")
        document_ids = request.data.get("document_ids")

        if not question:
            return Response(
                {"error": "Question field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_tier = "free"
        if hasattr(request.user, "profile"):
            user_tier = request.user.profile.tier

        doc_ids_filter = None
        if document_id:
            doc_ids_filter = [int(document_id)]
        elif document_ids and isinstance(document_ids, list):
            doc_ids_filter = [int(d) for d in document_ids]

        def event_stream():
            try:
                logger.info(f"Streaming question from user '{request.user.username}' [{user_tier.upper()}]: '{question[:40]}...'")
                chunks = retrieve_relevant_chunks(
                    question=question,
                    user=request.user,
                    document_ids=doc_ids_filter,
                    top_k=5,
                )

                if not chunks:
                    sources_evt = json.dumps({"type": "sources", "sources": []})
                    yield f"data: {sources_evt}\n\n"
                    chunk_evt = json.dumps({"type": "chunk", "text": "The uploaded documents do not contain relevant information to answer this question."})
                    yield f"data: {chunk_evt}\n\n"
                    done_evt = json.dumps({"type": "done"})
                    yield f"data: {done_evt}\n\n"
                    return

                sources = [
                    {
                        "document": c["document_name"],
                        "document_id": c["document_id"],
                        "page": c["page_number"],
                        "text": c["content"][:300],
                        "similarity_score": c["similarity_score"],
                    }
                    for c in chunks
                ]

                # Send sources payload first
                sources_evt = json.dumps({"type": "sources", "sources": sources})
                yield f"data: {sources_evt}\n\n"

                # Stream Gemini LLM output chunk by chunk
                for text_chunk in generate_answer_stream(question, chunks, user_tier=user_tier):
                    chunk_evt = json.dumps({"type": "chunk", "text": text_chunk})
                    yield f"data: {chunk_evt}\n\n"

                done_evt = json.dumps({"type": "done"})
                yield f"data: {done_evt}\n\n"
            except Exception as e:
                logger.error(f"Error during stream generation: {e}", exc_info=True)
                err_evt = json.dumps({"type": "error", "error": str(e)})
                yield f"data: {err_evt}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

