from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin Interface
    path("admin/", admin.site.urls),

    # 1. Global Identity & Security
    path("api/login/", TokenObtainPairView.as_view(), name="login"),
    path("api/refresh/", TokenRefreshView.as_view(), name="refresh"),

    # 2. Public Marketplace & API Documentation
    path("api/marketplace/", include("products.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"), 
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # 3. Farmer SaaS Portal (Private API Endpoints)
    path("api/my-farm/", include([
        path("accounts/", include("accounts.urls")),
        path("flock/", include("flock.urls")),
        path("finance/", include("finance.urls")),
        path("sales/", include("sales.urls")),
        path("inventory/", include("inventory.urls")),  
        path("dashboard/", include("dashboard.urls")),
    ])),

    # 4. React Frontend Catch-all (OUTSIDE the api prefix)
    # This must be the very last pattern. 
    # It serves index.html for any URL that doesn't match the paths above.
    re_path(r"^.*$", TemplateView.as_view(template_name='index.html'), name="app"),
]