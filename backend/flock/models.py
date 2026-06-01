from datetime import date

from django.conf import settings
from django.db import models
from django.db.models import Sum

from accounts.models import Farm


def batch_image_path(instance, filename):
    return f"farms/{instance.farm.id}/batches/{filename}"


# =========================================================
# FLOCK BATCH
# =========================================================

class FlockBatch(models.Model):

    FLOCK_TYPE_CHOICES = (
        ("broiler", "Broiler"),
        ("layer", "Layer"),
    )

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="batches",
    )

    name = models.CharField(
        max_length=100
    )

    flock_type = models.CharField(
        max_length=20,
        choices=FLOCK_TYPE_CHOICES,
        default="broiler",
    )

    batch_number = models.CharField(
        max_length=50,
        blank=True,
    )

    breed = models.CharField(
        max_length=100,
        blank=True,
    )

    quantity_received = models.PositiveIntegerField()

    acquisition_date = models.DateField(
        default=date.today
    )

    status = models.CharField(
        max_length=20,
        default="active",
    )

    chick_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    selling_price_per_bird = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    image = models.ImageField(
        upload_to=batch_image_path,
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"{self.batch_number} - {self.name}"

    # =====================================================
    # TOTAL MORTALITY
    # =====================================================

    @property
    def total_mortality_count(self):

        return (
            self.daily_records.aggregate(
                total=Sum("mortality")
            )["total"]
            or 0
        )

    # =====================================================
    # TOTAL SOLD
    # =====================================================

    @property
    def total_sold_count(self):

        from sales.models import OrderItem

        return (
            OrderItem.objects.filter(
                batch=self
            ).aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

    # =====================================================
    # TOTAL APPROVED ADJUSTMENTS
    # =====================================================

    @property
    def total_adjustments(self):

        added = (
            self.stock_adjustments.filter(
                adjustment_type="add",
                approved=True,
            ).aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        removed = (
            self.stock_adjustments.filter(
                adjustment_type="remove",
                approved=True,
            ).aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        return added - removed

    # =====================================================
    # CURRENT STOCK
    # =====================================================

    @property
    def current_stock(self):

        stock = (
            self.quantity_received
            - self.total_mortality_count
            - self.total_sold_count
            + self.total_adjustments
        )

        return max(stock, 0)

    # =====================================================
    # SURVIVAL RATE
    # =====================================================

    @property
    def survival_rate(self):

        if self.quantity_received <= 0:
            return 0

        alive_after_mortality = (
            self.quantity_received
            - self.total_mortality_count
        )

        rate = (
            alive_after_mortality
            / self.quantity_received
        ) * 100

        return round(rate, 1)

    # =====================================================
    # AGE
    # =====================================================

    @property
    def age_in_weeks(self):

        return max(
            0,
            (
                date.today()
                - self.acquisition_date
            ).days // 7
        )

    # =====================================================
    # SAVE
    # =====================================================

    def save(self, *args, **kwargs):

        if not self.batch_number:

            count = (
                FlockBatch.objects.filter(
                    farm=self.farm
                ).count()
                + 1
            )

            self.batch_number = f"B{count:03d}"

        super().save(*args, **kwargs)


# =========================================================
# DAILY RECORDS
# =========================================================

class DailyRecord(models.Model):

    flock = models.ForeignKey(
        FlockBatch,
        on_delete=models.CASCADE,
        related_name="daily_records",
    )

    date = models.DateField(
        default=date.today
    )

    mortality = models.PositiveIntegerField(
        default=0
    )

    feed_used_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
    )

    class Meta:
        unique_together = ["flock", "date"]

    def __str__(self):
        return f"{self.flock.batch_number} - {self.date}"


# =========================================================
# STOCK ADJUSTMENTS
# =========================================================

class StockAdjustment(models.Model):

    ADJUSTMENT_TYPES = (
        ("add", "Add Stock"),
        ("remove", "Remove Stock"),
    )

    REASON_CHOICES = (
        ("buyer_change", "Buyer Quantity Changed"),
        ("count_correction", "Count Correction"),
        ("death_transport", "Transport Death"),
        ("theft", "Theft/Loss"),
        ("donation", "Donation"),
        ("other", "Other"),
    )

    flock = models.ForeignKey(
        FlockBatch,
        on_delete=models.CASCADE,
        related_name="stock_adjustments",
    )

    adjustment_type = models.CharField(
        max_length=20,
        choices=ADJUSTMENT_TYPES,
    )

    reason = models.CharField(
        max_length=50,
        choices=REASON_CHOICES,
        default="other",
    )

    quantity = models.PositiveIntegerField()

    note = models.TextField(
        blank=True,
    )

    # =====================================================
    # AUDIT FIELDS
    # =====================================================

    stock_before = models.PositiveIntegerField(
        default=0
    )

    stock_after = models.PositiveIntegerField(
        default=0
    )

    approved = models.BooleanField(
        default=False
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_stock_adjustments",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_stock_adjustments",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):

        sign = "+" if self.adjustment_type == "add" else "-"

        return f"{self.flock.batch_number} {sign}{self.quantity}"

    # =====================================================
    # SAVE OVERRIDE
    # =====================================================

    def save(self, *args, **kwargs):

        is_new = self.pk is None

        if is_new:

            current_stock = self.flock.current_stock

            self.stock_before = current_stock

            if self.adjustment_type == "add":
                self.stock_after = current_stock + self.quantity
            else:
                self.stock_after = max( 
                    current_stock - self.quantity,
                    0
                )

            # AUTO APPROVE SMALL CHANGES
            if self.quantity <= 5:
                self.approved = True

        super().save(*args, **kwargs)