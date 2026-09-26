from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    class Tier(models.TextChoices):
        FREE = "free", "Free Tier"
        PRO = "pro", "Pro Tier"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.FREE)

    def __str__(self):
        return f"{self.user.username} ({self.tier.upper()})"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # Give admin users Pro tier by default
        initial_tier = UserProfile.Tier.PRO if (instance.is_superuser or instance.username == "admin") else UserProfile.Tier.FREE
        UserProfile.objects.create(user=instance, tier=initial_tier)
    else:
        if hasattr(instance, "profile"):
            if instance.is_superuser or instance.username == "admin":
                if instance.profile.tier != UserProfile.Tier.PRO:
                    instance.profile.tier = UserProfile.Tier.PRO
                    instance.profile.save()
