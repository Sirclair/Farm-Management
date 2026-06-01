from datetime import date
from django.db import models
from accounts.models import Farm


# =========================================================
# EXPENSE MODEL
# =========================================================
class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("feed", "Feed"),
        ("medicine", "Medication/Vaccines"),
        ("equipment", "Equipment/Tools"),
        ("labor", "Labor"),
        ("utilities", "Utilities"),
        ("fuel", "Fuel"),
        ("other", "Other"),
    ]

    SOURCE_CHOICES = [
        ("manual", "Manual"),
        ("inventory", "Inventory"),
        ("system", "System Generated"),
    ]

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="expenses"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    date = models.DateField(default=date.today)

    expense_source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="manual"
    )

    def __str__(self):
        return f"{self.get_category_display()}: R{self.amount} ({self.date})"


# =========================================================
# INCOME MODEL
# =========================================================
class Income(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="income_records"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=255)  # e.g. "Sold 20 Broilers"
    date = models.DateField(default=date.today)

    def __str__(self):
        return f"{self.source}: R{self.amount} ({self.date})"