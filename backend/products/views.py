from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer

class GlobalMarketplaceListView(generics.ListAPIView):
    """
    Worldwide Public API: Anyone can search and browse.
    """
    queryset = Product.objects.filter(is_available=True, stock_quantity__gt=0)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny] # No login required
    
    # World-class search & filter capabilities
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'farm__country', 'farm__currency_code']
    search_fields = ['name', 'description', 'farm__name']
    ordering_fields = ['price', 'created_at']

    def get_queryset(self):
        # Optional: Only show products from farms with active subscriptions
        return super().get_queryset().filter(farm__is_active_subscription=True)