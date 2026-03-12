from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import F, Sum

from flock.models import FlockBatch
from accounts.models import Farm
from finance.models import Income


class Customer(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="customers"
    )
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.farm.name})"


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    )

    PAYMENT_METHODS = (
        ("cash", "Cash"),
        ("eft", "EFT"),
        ("card", "Card"),
        ("mobile_money", "Mobile Money"),
    )

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="orders"
    )
    user_customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchases"
    )
    manual_customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="cash")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        name = "Unknown"
        if self.user_customer:
            name = self.user_customer.get_full_name() or self.user_customer.username
        elif self.manual_customer:
            name = self.manual_customer.full_name
        return f"Order #{self.id} - {name}"

    def update_total(self):
        """Recalculate total_amount from related OrderItems"""
        total = self.items.aggregate(
            total=Sum(F("quantity") * F("price_at_sale"))
        )["total"] or 0
        Order.objects.filter(pk=self.pk).update(total_amount=total)


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name="items",
        on_delete=models.CASCADE
    )
    batch = models.ForeignKey(
        FlockBatch,
        on_delete=models.CASCADE,
        related_name="sales_items"
    )
    quantity = models.PositiveIntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Default price from batch if not provided
        if not self.price_at_sale:
            self.price_at_sale = self.batch.selling_price_per_bird

        with transaction.atomic():
            batch = FlockBatch.objects.select_for_update().get(id=self.batch.id)

            # Only check stock if creating a new OrderItem
            if not self.pk:
                if batch.current_stock < self.quantity:
                    raise ValidationError(
                        f"Insufficient stock in {batch.name}. Available: {batch.current_stock}"
                    )
                # Reduce stock
                batch.current_stock -= self.quantity
                batch.save()

            super().save(*args, **kwargs)

            # Update order total after saving
            self.order.update_total()

            # Record income only on creation
            if not self.pk:
                Income.objects.create(
                    farm=self.order.farm,
                    amount=self.quantity * self.price_at_sale,
                    source=f"Bird sales - Batch {self.batch.batch_number}"
                )

    def __str__(self):
        return f"{self.quantity} birds from {self.batch.name}"