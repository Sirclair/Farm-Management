from django.urls import path
from .views import GlobalMarketplaceListView

urlpatterns = [
    # Example: /api/marketplace/?search=chicken&farm__country=South+Africa
    path('search/', GlobalMarketplaceListView.as_view(), name='global-search'),
]