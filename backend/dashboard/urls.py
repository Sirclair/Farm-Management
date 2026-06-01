# dashboard/urls.py

from django.urls import path

from .views import FarmDashboardView, farm_kpis

urlpatterns = [
    path("kpis/", farm_kpis, name="farm-kpis"),
    path("dashboard/", FarmDashboardView.as_view(), name="farm-dashboard"),
]
