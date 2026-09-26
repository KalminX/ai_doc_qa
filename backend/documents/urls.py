from django.urls import path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    AdminDocumentListView,
    AdminDeleteDocumentView,
    AdminDeleteUserDocumentsView,
    AdminDeleteAllDocumentsView,
    BatchAutoRenameView,
)

urlpatterns = [
    path("", DocumentListCreateView.as_view(), name="document_list_create"),
    path("upload/", DocumentListCreateView.as_view(), name="document_upload"),
    path("rename-all/", BatchAutoRenameView.as_view(), name="documents_rename_all"),
    path("<int:pk>/", DocumentDetailView.as_view(), name="document_detail"),
    # Admin management routes
    path("admin/list/", AdminDocumentListView.as_view(), name="admin_document_list"),
    path("admin/<int:pk>/", AdminDeleteDocumentView.as_view(), name="admin_delete_document"),
    path("admin/user/<int:user_id>/", AdminDeleteUserDocumentsView.as_view(), name="admin_delete_user_documents"),
    path("admin/purge-all/", AdminDeleteAllDocumentsView.as_view(), name="admin_purge_all_documents"),
]

