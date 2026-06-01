from django.db import models
from accounts.models import Farm


class ProductCategory(models.Model):
    name = models.CharField(max_length=100)

    description = models.TextField(
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Product Categories"


class Product(models.Model):

    # =====================================================
    # PRODUCT TYPES
    # =====================================================

    PRODUCT_TYPE_CHOICES = (
        ("inventory", "Inventory"),
        ("live", "Live Bird"),
        ("processed", "Processed Chicken"),
    )

    # =====================================================
    # SELLING UNITS
    # =====================================================

    SELLING_UNIT_CHOICES = (
        ("unit", "Per Unit"),
        ("kg", "Per Kilogram"),
        ("tray", "Per Tray"),
    )

    # =====================================================
    # LIVE TYPES
    # =====================================================

    LIVE_TYPE_CHOICES = (
        ("broiler", "Broiler"),
        ("layer", "Layer"),
    )

    # =====================================================
    # FARM
    # =====================================================

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="products",
    )

    # =====================================================
    # CATEGORY
    # =====================================================

    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    # =====================================================
    # DETAILS
    # =====================================================

    name = models.CharField(max_length=255)

    description = models.TextField(
        blank=True,
        null=True,
    )

    # =====================================================
    # TYPE
    # =====================================================

    product_type = models.CharField(
        max_length=20,
        choices=PRODUCT_TYPE_CHOICES,
        default="inventory",
    )

    # =====================================================
    # LIVE BIRD TYPE
    # =====================================================

    live_type = models.CharField(
        max_length=20,
        choices=LIVE_TYPE_CHOICES,
        blank=True,
        null=True,
    )

    # =====================================================
    # UNIT
    # =====================================================

    selling_unit = models.CharField(
        max_length=20,
        choices=SELLING_UNIT_CHOICES,
        default="unit",
    )

    # =====================================================
    # PRICING
    # =====================================================

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    # =====================================================
    # STOCK
    # =====================================================

    stock_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    # =====================================================
    # BULK DISCOUNT
    # =====================================================

    bulk_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    bulk_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    # =====================================================
    # STATUS
    # =====================================================

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# =====================================================
# INVENTORY ITEMS
# =====================================================

class InventoryItem(models.Model):

    CATEGORY_CHOICES = [
        ("med", "Medication"),
        ("vac", "Vaccine"),
        ("feed", "Feed Additive"),
    ]

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="inventory",
    )

    name = models.CharField(max_length=255)

    category = models.CharField(
        max_length=10,
        choices=CATEGORY_CHOICES,
    )

    quantity_on_hand = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    unit = models.CharField(
        max_length=20,
        default="liters",
    )

    min_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Alert when stock hits this",
    )

    @property
    def is_low(self):
        return self.quantity_on_hand <= self.min_threshold

    def __str__(self):
        return f"{self.name} ({self.quantity_on_hand} {self.unit})"