from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # 1. Global Identity & Security
    path("api/login/", TokenObtainPairView.as_view(), name="login"),
    path("api/refresh/", TokenRefreshView.as_view(), name="refresh"),

    # 2. Public Marketplace (World-Wide Access)
    # Customers from anywhere browse these
    path("api/marketplace/", include("products.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"), 
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # 3. Farmer SaaS Portal (Private Multi-Tenant)
    # Farmers manage their specific business here
    path("api/my-farm/", include([
        path("accounts/", include("accounts.urls")),
        path("flock/", include("flock.urls")),
        path("finance/", include("finance.urls")),
        path("sales/", include("sales.urls")),
        path("inventory/", include("inventory.urls")),  
        path("dashboard/", include("dashboard.urls")),
        
    ])),
]