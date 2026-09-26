from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    tier = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "tier", "is_staff", "is_superuser")

    def get_tier(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.tier
        return "free"

