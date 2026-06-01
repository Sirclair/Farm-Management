from django.db import models


# =========================
# INVENTORY
# =========================
class InventoryItem(models.Model):
    farm = models.ForeignKey(
        "accounts.Farm",
        on_delete=models.CASCADE,
        related_name="inventory_stock"
    )

    name = models.CharField(max_length=100)

    category = models.CharField(
        max_length=20,
        default="feed"
    )

    current_level = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    unit_of_measure = models.CharField(
        max_length=20,
        default="KG"
    )

    cost_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    min_stock_level = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("name", "farm")

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.upper().strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# =========================
# STOCK LOG
# =========================
class StockLog(models.Model):

    ACTION_CHOICES = [
        ("add", "Stock In"),
        ("use", "Stock Out"),
        ("adj", "Adjustment"),
    ]

    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="logs"
    )

    action = models.CharField(
        max_length=10,
        choices=ACTION_CHOICES
    )

    quantity_changed = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    unit_price_at_time = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.name} - {self.action}"


# =========================
# SUPPLIER
# =========================
class Supplier(models.Model):

    farm = models.ForeignKey(
        "accounts.Farm",
        on_delete=models.CASCADE,
        related_name="suppliers"
    )

    name = models.CharField(max_length=120)

    contact_person = models.CharField(
        max_length=120,
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    email = models.EmailField(
        blank=True,
        null=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# =========================
# PURCHASE ORDER
# =========================
class PurchaseOrder(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("confirmed", "Confirmed"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    farm = models.ForeignKey(
        "accounts.Farm",
        on_delete=models.CASCADE,
        related_name="purchase_orders"
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    reference = models.CharField(
        max_length=50,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft"
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["farm", "status"]),
            models.Index(fields=["reference"]),
        ]

    def __str__(self):
        return self.reference


# =========================
# PURCHASE ORDER ITEM
# =========================
class PurchaseOrderItem(models.Model):

    order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )

    item_name = models.CharField(max_length=120)

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def get_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.item_name} ({self.quantity})"


# =========================
# INVENTORY PURCHASE
# =========================
class InventoryPurchase(models.Model):

    farm = models.ForeignKey(
        "accounts.Farm",
        on_delete=models.CASCADE,
        related_name="inventory_purchases"
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="purchases"
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    total_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.inventory_item.name} - R{self.total_cost}"