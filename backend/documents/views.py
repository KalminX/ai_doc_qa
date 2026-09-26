from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from .tasks import process_document_async

class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentUploadSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        doc = Document.objects.create(
            user=request.user,
            filename=uploaded_file.name,
            file=uploaded_file,
            status=Document.Status.UPLOADED,
        )

        # Trigger background indexing
        process_document_async(doc.id)

        response_serializer = DocumentSerializer(doc)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class DocumentDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()


# ---------------------------------------------------------------------------
# ADMIN PANELS & MANAGEMENT VIEWS
# ---------------------------------------------------------------------------

class AdminDocumentListView(generics.ListAPIView):
    """
    List all documents across all users for admin management.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = DocumentSerializer
    queryset = Document.objects.all().select_related("user")


class AdminDeleteDocumentView(APIView):
    """
    Delete any specific document by ID (Admin).
    """
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
            if doc.file:
                doc.file.delete(save=False)
            doc.delete()
            return Response({"detail": f"Document ID {pk} deleted successfully."}, status=status.HTTP_200_OK)
        except Document.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)


class AdminDeleteUserDocumentsView(APIView):
    """
    Delete all documents belonging to a specific user (Admin).
    """
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, user_id):
        docs = Document.objects.filter(user_id=user_id)
        count = docs.count()
        for doc in docs:
            if doc.file:
                doc.file.delete(save=False)
            doc.delete()
        return Response({"detail": f"Deleted {count} documents for user ID {user_id}."}, status=status.HTTP_200_OK)


class AdminDeleteAllDocumentsView(APIView):
    """
    Purge ALL documents across the entire application (Admin).
    """
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request):
        docs = Document.objects.all()
        count = docs.count()
        for doc in docs:
            if doc.file:
                doc.file.delete(save=False)
            doc.delete()
        return Response({"detail": f"Purged all {count} system-wide documents."}, status=status.HTTP_200_OK)


class BatchAutoRenameView(APIView):
    """
    Auto-rename all existing documents using Gemini LLM to generate neat titles.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from services.gemini_service import clean_document_title

        user_tier = "free"
        if hasattr(request.user, "profile"):
            user_tier = request.user.profile.tier

        # If admin, can rename all docs in system, else user's own docs
        if request.user.is_staff or request.user.is_superuser:
            docs = Document.objects.all()
        else:
            docs = Document.objects.filter(user=request.user)

        renamed_count = 0
        for doc in docs:
            sample_text = ""
            first_chunk = doc.chunks.first()
            if first_chunk:
                sample_text = first_chunk.content

            clean_title = clean_document_title(doc.filename, sample_text, user_tier=user_tier)
            if clean_title and clean_title != doc.filename:
                doc.title = clean_title
                doc.save(update_fields=["title"])
                renamed_count += 1

        return Response(
            {"detail": f"Successfully auto-renamed {renamed_count} document(s) using Gemini LLM."},
            status=status.HTTP_200_OK,
        )

