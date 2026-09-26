from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from documents.models import Document, DocumentChunk
from services.pdf_service import clean_text
from services.chunking_service import chunk_document

class DocumentsApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="docuser", password="password123"
        )
        self.other_user = User.objects.create_user(
            username="otheruser", password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch("documents.views.process_document_async")
    def test_upload_and_list_documents(self, mock_process_async):
        pdf_content = b"%PDF-1.4 Fake PDF Content Header For Testing"
        uploaded_file = SimpleUploadedFile("sample.pdf", pdf_content, content_type="application/pdf")
        
        res = self.client.post("/api/documents/upload/", {"file": uploaded_file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(Document.objects.first().filename, "sample.pdf")
        self.assertTrue(mock_process_async.called)

        # Check list endpoint
        list_res = self.client.get("/api/documents/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data["results"] if "results" in list_res.data else list_res.data
        self.assertEqual(len(results), 1)

    def test_user_document_isolation(self):
        doc = Document.objects.create(
            user=self.other_user,
            filename="private.pdf",
            status=Document.Status.INDEXED
        )

        # User tries to access other_user's document
        res = self.client.get(f"/api/documents/{doc.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_pdf_clean_text_and_chunking(self):
        dirty = "  Header \n\n\n Paragraph 1   with spaces.  \n  Paragraph 2.  "
        cleaned = clean_text(dirty)
        self.assertIn("Header", cleaned)
        self.assertIn("Paragraph 1 with spaces.", cleaned)

        doc = Document.objects.create(user=self.user, filename="test.pdf")
        pages = [{"page_number": 1, "text": "This is page 1 content. " * 50}]
        chunks = chunk_document(doc, pages)
        self.assertTrue(len(chunks) >= 1)
        self.assertEqual(DocumentChunk.objects.count(), len(chunks))
