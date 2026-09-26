from django.db import models
from django.contrib.auth.models import User
from pgvector.django import VectorField

class Document(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        INDEXED = "indexed", "Indexed"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
    title = models.CharField(max_length=255, blank=True, default="")
    page_count = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-uploaded_at"]

    @property
    def display_name(self):
        return self.title if self.title else self.filename

    def __str__(self):
        return f"{self.display_name} ({self.status})"


    def delete(self, *args, **kwargs):
        # Delete physical file from server local disk
        if self.file:
            self.file.delete(save=False)
        # Delete database object and cascaded DocumentChunk records in PostgreSQL/pgvector
        super().delete(*args, **kwargs)


class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="chunks")
    content = models.TextField()
    page_number = models.IntegerField()
    embedding = VectorField(dimensions=768, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["page_number", "id"]
        indexes = [
            models.Index(fields=["document", "page_number"]),
        ]

    def __str__(self):
        return f"Doc {self.document_id} - Page {self.page_number} - Chunk {self.id}"
