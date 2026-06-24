from datetime import date
from django.db import models
from accounts.models import Farm
from django.utils import timezone


# =========================================================
# FINANCE PERIOD MODEL
# Used to separate weekly/monthly financial records
# =========================================================
class FinancePeriod(models.Model):

    STATUS_CHOICES = [
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="finance_periods"
    )

    name = models.CharField(
        max_length=100,
        blank=True
    )  # Example: Week 25 2026

    start_date = models.DateField(
        default=date.today
    )

    end_date = models.DateField(
        null=True,
        blank=True
    )

    opening_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total_expense = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    cash_out = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    closing_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )

    closed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
         default=timezone.now,
       
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return (
            self.name
            or f"Finance {self.start_date}"
        )


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

    period = models.ForeignKey(
        FinancePeriod,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    description = models.TextField(
        blank=True
    )

    date = models.DateField(
        default=date.today
    )

    expense_source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="manual"
    )

    created_at = models.DateTimeField(
        
        default=timezone.now,
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return (
            f"{self.get_category_display()}"
            f" - R{self.amount}"
        )


# =========================================================
# INCOME MODEL
# =========================================================
class Income(models.Model):

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="income_records"
    )

    period = models.ForeignKey(
        FinancePeriod,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="income_records"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    source = models.CharField(
        max_length=255
    )

    date = models.DateField(
        default=date.today
    )

    created_at = models.DateTimeField(
         default=timezone.now,
       
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return (
            f"{self.source}"
            f" - R{self.amount}"
        )