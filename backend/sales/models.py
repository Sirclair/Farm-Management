from decimal import Decimal
from django.db import models
from django.utils import timezone
from accounts.models import Farm
from products.models import Product
from flock.models import FlockBatch

# =========================================================
# CUSTOMER
# =========================================================
class Customer(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="customers",
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


# =========================================================
# ORDER
# =========================================================
class Order(models.Model):
    PAYMENT_STATUS = (
        ("unpaid", "Unpaid"),
        ("partial", "Partial"),
        ("paid", "Paid"),
    )

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    order_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
    )
    notes = models.TextField(blank=True, null=True)
    
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    total_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    balance_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default="unpaid",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        # Auto-generate order number if missing
        if not self.order_number:
            today = timezone.now().strftime("%Y%m%d")
            last_order = Order.objects.filter(
                order_number__startswith=f"ORD-{today}"
            ).count() + 1
            self.order_number = f"ORD-{today}-{last_order:04d}"
        
        # Guard against recursive call loop during calculate_totals execution
        if not kwargs.get('update_fields'):
            # Calculate inline balances before finalizing database save
            subtotal = Decimal("0.00")
            if self.pk:
                for item in self.items.all():
                    subtotal += item.total()
                
                paid = self.payments.aggregate(
                    total=models.Sum("amount")
                )["total"] or Decimal("0.00")
            else:
                paid = Decimal("0.00")

            self.subtotal = subtotal
            self.total_paid = paid
            self.balance_due = max(Decimal("0.00"), subtotal - paid)

            if self.balance_due <= 0:
                self.payment_status = "paid"
            elif paid > 0:
                self.payment_status = "partial"
            else:
                self.payment_status = "unpaid"

        super().save(*args, **kwargs)

    def calculate_totals(self):
        """
        Public method to manually trigger balance recalculation logs 
        from related signals, items, or payment mutations.
        """
        subtotal = Decimal("0.00")
        for item in self.items.all():
            subtotal += item.total()

        paid = self.payments.aggregate(
            total=models.Sum("amount")
        )["total"] or Decimal("0.00")

        self.subtotal = subtotal
        self.total_paid = paid
        self.balance_due = max(Decimal("0.00"), subtotal - paid)

        if self.balance_due <= 0:
            self.payment_status = "paid"
        elif paid > 0:
            self.payment_status = "partial"
        else:
            self.payment_status = "unpaid"

        super().save(update_fields=[
            "subtotal",
            "total_paid",
            "balance_due",
            "payment_status",
        ])

    def __str__(self):
        return self.order_number or f"Order #{self.id}"


# =========================================================
# ORDER ITEM
# =========================================================
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    batch = models.ForeignKey(
        FlockBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2)
    cost_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def total(self):
        return self.quantity * self.price_per_unit

    def cost_total(self):
        return self.quantity * self.cost_per_unit

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.order.calculate_totals()

    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        order.calculate_totals()

    def __str__(self):
        if self.product:
            return self.product.name
        if self.batch:
            return f"{self.batch.name} Live Chickens"
        return f"Item #{self.id}"


# =========================================================
# PAYMENT
# =========================================================
class Payment(models.Model):
    PAYMENT_METHODS = (
        ("cash", "Cash"),
        ("card", "Card"),
        ("transfer", "Transfer"),
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="cash",
    )
    reference = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.order.calculate_totals()

    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        order.calculate_totals()

    def __str__(self):
        return f"{self.amount} - {self.method}"


# =========================================================
# PENDING ORDER
# =========================================================
class PendingOrder(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("partial", "Partial"),
        ("fulfilled", "Fulfilled"),
        ("cancelled", "Cancelled"),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="pending_orders")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="pending_orders")

    order_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    expected_delivery_date = models.DateField(null=True, blank=True)
    delivery_time = models.TimeField(null=True, blank=True)
    delivery_address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    deposit_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.order_number:
            today = timezone.now().strftime("%Y%m%d")
            last = PendingOrder.objects.filter(order_number__startswith=f"PO-{today}").count() + 1
            self.order_number = f"PO-{today}-{last:04d}"

        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        if not self.pk:
            return Decimal("0.00")

        return sum(
            (item.line_total for item in self.items.all()),
            Decimal("0.00")
        )

    @property
    def balance_due(self):
        return max(Decimal("0.00"), self.total_amount - self.deposit_paid)

# =========================================================
# PENDING ORDER ITEM
# =========================================================
class PendingOrderItem(models.Model):
    pending_order = models.ForeignKey(
        PendingOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    batch = models.ForeignKey(
        FlockBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_fulfilled = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal("0.00")
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def quantity_remaining(self):
        return max(Decimal("0.00"), self.quantity_ordered - self.quantity_fulfilled)

    @property
    def line_total(self):
        return self.quantity_ordered * self.unit_price

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # No longer need to manually trigger calculate_total database column modifications

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

    def __str__(self):
        if self.product:
            return self.product.name
        if self.batch:
            return f"{self.batch.name} Live Chickens"
        return f"Pending Item #{self.id}"

# =========================================================
# PENDING ORDER FULFILLMENT
# =========================================================
class PendingOrderFulfillment(models.Model):
    pending_order_item = models.ForeignKey(
        PendingOrderItem,
        on_delete=models.CASCADE,
        related_name="fulfillments"
    )
    quantity_delivered = models.DecimalField(max_digits=12, decimal_places=2)
    delivered_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        if self.pending_order_item.product:
            return f"{self.pending_order_item.product.name} - {self.quantity_delivered}"
        if self.pending_order_item.batch:
            return f"{self.pending_order_item.batch.name} - {self.quantity_delivered}"
        return f"Fulfillment #{self.id}"