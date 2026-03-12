# dashboard/urls.py

from django.urls import path
from .views import farm_kpis, FarmDashboardView

urlpatterns = [
    path("kpis/", farm_kpis, name="farm-kpis"),
    path("dashboard/", FarmDashboardView.as_view(), name='farm-dashboard'),
]