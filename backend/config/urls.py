from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path  # <--- MAKE SURE 'path' and 'include' ARE HERE
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static

def api_home(request):
    return JsonResponse({"status": "online", "message": "Zonke Farms API"})


urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "api/refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),

    path(
        "api/my-farm/",
        include([
            path(
                "accounts/",
                include("accounts.urls")
            ),

            path(
                "flock/",
                include("flock.urls")
            ),

            path(
                "finance/",
                include("finance.urls")
            ),

            path(
                "sales/",
                include("sales.urls")
            ),

            path(
                "inventory/",
                include("inventory.urls")
            ),

            path(
                "products/",
                include("products.urls")
            ),

            path(
                "dashboard/",
                include("dashboard.urls")
            ),

            path(
                "ai/",
                include("ai.urls")
            ),
        ]),
    ),

    path(
        "api/marketplace/",
        include("products.urls"),
    ),

    path(
        "api/explore-farms/",
        include("accounts.urls"),
    ),

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),

    path(
        "",
        api_home,
    ),
]

# IMPORTANT
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)