from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.utils import get_user_farm

from .models import (
    Product,
    ProductCategory,
    InventoryItem,
)

from .serializers import (
    ProductSerializer,
    ProductCategorySerializer,
    InventoryItemSerializer,
)


# =====================================================
# PRODUCT CATEGORY
# =====================================================

class ProductCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]

    queryset = ProductCategory.objects.all().order_by("name")


# =====================================================
# PRODUCTS
# =====================================================

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, "swagger_fake_view", False):
            return Product.objects.none()

        farm = get_user_farm(self.request.user)

        return (
            Product.objects
            .filter(farm=farm)
            .select_related("category")
            .order_by("name")
        )

    def perform_create(self, serializer):

        serializer.save(
            farm=get_user_farm(self.request.user)
        )


# =====================================================
# INVENTORY
# =====================================================

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, "swagger_fake_view", False):
            return InventoryItem.objects.none()

        farm = get_user_farm(self.request.user)

        return (
            InventoryItem.objects
            .filter(farm=farm)
            .order_by("name")
        )

    def perform_create(self, serializer):

        serializer.save(
            farm=get_user_farm(self.request.user)
        )