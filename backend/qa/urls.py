from django.urls import path
from .views import AskQuestionView, AskQuestionStreamView

urlpatterns = [
    path("ask/", AskQuestionView.as_view(), name="qa_ask"),
    path("stream/", AskQuestionStreamView.as_view(), name="qa_stream"),
]

