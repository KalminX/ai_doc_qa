from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from documents.models import Document, DocumentChunk

class QaApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="qauser", password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.doc = Document.objects.create(
            user=self.user,
            filename="policy.pdf",
            status=Document.Status.INDEXED,
            page_count=5
        )
        fake_vector = [0.1] * 768
        self.chunk = DocumentChunk.objects.create(
            document=self.doc,
            content="The standard refund policy period is 30 days from purchase.",
            page_number=4,
            embedding=fake_vector
        )

    @patch("qa.views.generate_answer")
    @patch("qa.views.retrieve_relevant_chunks")
    def test_ask_question_success(self, mock_retrieve, mock_gen_answer):
        mock_retrieve.return_value = [
            {
                "chunk_id": self.chunk.id,
                "document_id": self.doc.id,
                "document_name": "policy.pdf",
                "page_number": 4,
                "content": self.chunk.content,
                "similarity_score": 0.95,
            }
        ]
        mock_gen_answer.return_value = "The refund period is 30 days according to company policy."

        payload = {
            "question": "What is the refund policy?",
            "document_id": self.doc.id
        }
        res = self.client.post("/api/questions/ask/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("answer", res.data)
        self.assertIn("sources", res.data)
        self.assertTrue(len(res.data["sources"]) > 0)
        self.assertEqual(res.data["sources"][0]["document"], "policy.pdf")
        self.assertEqual(res.data["sources"][0]["page"], 4)

    def test_ask_question_missing_field(self):
        res = self.client.post("/api/questions/ask/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
