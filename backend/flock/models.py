from django.db import models, transaction
from django.db.models import Sum
from accounts.models import Farm
from datetime import date

class FlockBatch(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="batches")
    name = models.CharField(max_length=100)
    batch_number = models.CharField(max_length=50, unique=True, blank=True)
    breed = models.CharField(max_length=100, blank=True)
    quantity_received = models.PositiveIntegerField()
    # current_stock tracks exactly how many birds are physically in the house
    current_stock = models.PositiveIntegerField(editable=False, null=True, blank=True)
    acquisition_date = models.DateField(default=date.today)
    status = models.CharField(max_length=20, default="active")
    chick_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    feed_cost_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price_per_bird = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.batch_number} - {self.name}"

    @property
    def total_mortality_count(self):
        """Strictly pulls from DailyRecord logs."""
        return self.daily_records.aggregate(total=Sum("mortality"))["total"] or 0

    @property
    def total_sold_count(self):
        """Strictly pulls from Sales/Order logs."""
        # Assuming your OrderItem model has a related_name of 'order_items'
        return self.orderitem_set.aggregate(total=Sum("quantity"))["total"] or 0

    @property
    def mortality_percentage(self):
        """Calculates health based on actual deaths vs initial stock."""
        if self.quantity_received > 0:
            return round(
                (self.total_mortality_count / self.quantity_received) * 100, 2
            )
        return 0

    def save(self, *args, **kwargs):
        if not self.batch_number:
            last_batch = FlockBatch.objects.order_by("id").last()
            if not last_batch:
                self.batch_number = "B001"
            else:
                try:
                    last_num = int(last_batch.batch_number[1:])
                    self.batch_number = f"B{str(last_num + 1).zfill(3)}"
                except (ValueError, TypeError):
                    self.batch_number = f"B{self.pk if self.pk else 'NEW'}"

        if self._state.adding and self.current_stock is None:
            self.current_stock = self.quantity_received

        super().save(*args, **kwargs)


class DailyRecord(models.Model):
    flock = models.ForeignKey(
        FlockBatch,
        on_delete=models.CASCADE,
        related_name="daily_records",
    )
    date = models.DateField(default=date.today)
    mortality = models.PositiveIntegerField(default=0)
    feed_used_kg = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    class Meta:
        unique_together = ["flock", "date"]

    def __str__(self):
        return f"{self.flock.batch_number} - {self.date}"

    def save(self, *args, **kwargs):
        """
        Atomic update: When a daily record is saved, we subtract the 
        mortality from the physical current_stock.
        """
        with transaction.atomic():
            if self._state.adding:
                flock = FlockBatch.objects.select_for_update().get(id=self.flock.id)
                if self.mortality > flock.current_stock:
                    raise ValueError(f"Mortality ({self.mortality}) cannot exceed current stock ({flock.current_stock})")

                flock.current_stock -= self.mortality
                flock.save()
            
            # If updating an existing record, you'd need logic here to adjust
            # based on the diff between old and new mortality values.
            super().save(*args, **kwargs)