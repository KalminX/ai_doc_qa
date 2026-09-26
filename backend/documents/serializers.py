from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    chunk_count = serializers.SerializerMethodField()
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Document
        fields = (
            "id",
            "filename",
            "title",
            "display_name",
            "file",
            "uploaded_at",
            "status",
            "page_count",
            "chunk_count",
            "error_message",
            "user_id",
            "user_username",
        )
        read_only_fields = ("id", "uploaded_at", "status", "page_count", "chunk_count", "error_message", "user_id", "user_username", "display_name")



    def get_chunk_count(self, obj):
        return obj.chunks.count()

class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("file",)

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are supported.")
        return value
