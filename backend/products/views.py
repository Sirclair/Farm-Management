from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Product, ProductCategory, InventoryItem
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

    queryset = ProductCategory.objects.all()


# =====================================================
# PRODUCTS
# =====================================================

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        print("USER:", self.request.user)

        print("ACTIVE FARM:", self.request.user.active_farm)

        farm = self.request.user.active_farm

        if not farm:
            return Product.objects.none()

        return Product.objects.filter(
            farm=farm
        ).select_related("category")

    def perform_create(self, serializer):
        serializer.save(
            farm=self.request.user.active_farm
        )


# =====================================================
# INVENTORY
# =====================================================

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = self.request.user.active_farm

        if not farm:
            return InventoryItem.objects.none()

        return InventoryItem.objects.filter(farm=farm)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)