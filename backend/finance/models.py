from django.db import models
from datetime import date
from accounts.models import Farm

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('feed', 'Feed'),
        ('medication', 'Medication'),
        ('equipment', 'Equipment'),
        ('labor', 'Labor'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    date = models.DateField(default=date.today)

    def __str__(self):
        return f"{self.get_category_display()}: R{self.amount} ({self.date})"

class Income(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='income_records')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=255)
    date = models.DateField(default=date.today)

    def __str__(self):
        return f"{self.source}: R{self.amount} ({self.date})"