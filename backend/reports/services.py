from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum

from sales.models import Order
from finance.models import Expense
from flock.models import FlockBatch


class FarmReportService:

    @staticmethod
    def generate(farm):

        if not farm:
            return {
                "summary": {},
                "batches": [],
                "insights": [],
            }

        # ==================================================
        # SALES
        # ==================================================

        orders = Order.objects.filter(
            farm=farm
        )

        revenue = (
            orders.aggregate(
                total=Sum("subtotal")
            )["total"]
            or Decimal("0.00")
        )

        paid = (
            orders.aggregate(
                total=Sum("total_paid")
            )["total"]
            or Decimal("0.00")
        )

        debt = (
            orders.aggregate(
                total=Sum("balance_due")
            )["total"]
            or Decimal("0.00")
        )

        # ==================================================
        # EXPENSES
        # ==================================================

        expenses = Expense.objects.filter(
            farm=farm
        )

        total_expenses = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        feed_cost = (
            expenses.filter(
                category__icontains="feed"
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        # ==================================================
        # FLOCK
        # ==================================================

        batches = (
            FlockBatch.objects
            .filter(farm=farm)
            .order_by("-id")
        )

        birds = sum(
            batch.current_stock
            for batch in batches
        )

        mortality = sum(
            batch.total_mortality_count
            for batch in batches
        )

        # ==================================================
        # LAST 7 DAYS
        # ==================================================

        last_week = (
            timezone.now()
            -
            timedelta(days=7)
        )

        weekly = (
            orders.filter(
                created_at__gte=last_week
            ).aggregate(
                total=Sum("subtotal")
            )["total"]
            or Decimal("0.00")
        )

        # ==================================================
        # INSIGHTS
        # ==================================================

        insights = []

        if revenue > total_expenses:
            insights.append({
                "type": "success",
                "message": "Farm operating profitably",
            })

        if debt > 0:
            insights.append({
                "type": "warning",
                "message": f"Outstanding customer debt R {debt}",
            })

        if mortality >= 10:
            insights.append({
                "type": "risk",
                "message": "Mortality requires investigation",
            })

        # ==================================================
        # RESPONSE
        # ==================================================

        return {

            "summary": {

                "revenue": float(revenue),

                "paid": float(paid),

                "debt": float(debt),

                "expenses": float(total_expenses),

                "profit": float(
                    revenue
                    -
                    total_expenses
                ),

                "feed_cost": float(feed_cost),

                "orders": orders.count(),

                "birds": birds,

                "mortality": mortality,

                "weekly_revenue": float(weekly),
            },

            # FIXED SECTION
            "batches": [

                {
                    "id": batch.id,

                    "batch_number":
                        batch.batch_number,

                    "survival_rate":
                        batch.survival_rate,

                    "acquisition_date":
                        batch.acquisition_date,

                    "stock":
                        batch.current_stock,

                    "mortality":
                        batch.total_mortality_count,
                }

                for batch in batches
            ],

            "insights": insights,
        }