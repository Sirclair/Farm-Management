from django.urls import path
from .views import ai_insights, download_ai_report

urlpatterns = [
    path("insights/", ai_insights),
    path("report/", download_ai_report),
]
