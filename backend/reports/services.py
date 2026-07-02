from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum, F

from sales.models import Order, OrderItem
from finance.models import Expense
from flock.models import FlockBatch
from inventory.models import InventoryPurchase, StockLog
from finance.services import get_open_period


class FarmReportService:

    @staticmethod
    def generate(farm):

        if not farm:
            return {
                "summary": {},
                "expense_breakdown": {},
                "batches": [],
                "insights": [],
                "weekly_inventory": {},
            }

        current_period = get_open_period(farm)

        now = timezone.now()
        last_7_days = now - timedelta(days=7)

        # ==================================================
        # PERIOD RANGE
        # ==================================================

        period_start = (
            current_period.start_date
            if current_period
            else None
        )

        period_end = (
            current_period.end_date
            if current_period
            else None
        )

        # ==================================================
        # ORDERS
        # ==================================================

        orders = Order.objects.filter(
            farm=farm
        )

        if period_start:
            orders = orders.filter(
                created_at__date__gte=period_start
            )

        if period_end:
            orders = orders.filter(
                created_at__date__lte=period_end
            )

        revenue = (
            orders.aggregate(
                total=Sum("subtotal")
            )["total"]
            or Decimal("0")
        )

        paid = (
            orders.aggregate(
                total=Sum("total_paid")
            )["total"]
            or Decimal("0")
        )

        debt = (
            orders.aggregate(
                total=Sum("balance_due")
            )["total"]
            or Decimal("0")
        )

        # ==================================================
        # EXPENSES
        # ==================================================

        expenses = Expense.objects.filter(
            farm=farm
        )

        if current_period:
            expenses = expenses.filter(
                period=current_period
            )

        labour_cost = (
            expenses.filter(
                category="labor"
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0")
        )

        utility_cost = (
            expenses.filter(
                category="utilities"
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0")
        )

        inventory_cost = (
            expenses.exclude(
                category__in=[
                    "feed",
                    "medicine",
                    "labor",
                    "utilities"
                ]
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0")
        )

        # ==================================================
        # FEED COST FROM USAGE
        # ==================================================

        feed_logs = StockLog.objects.filter(
            item__farm=farm,
            action="use",
            item__category="feed",
        )

        if period_start:
            feed_logs = feed_logs.filter(
                timestamp__date__gte=period_start
            )

        if period_end:
            feed_logs = feed_logs.filter(
                timestamp__date__lte=period_end
            )

        feed_cost = sum(
            (
                log.quantity_changed
                * log.unit_price_at_time
            )
            for log in feed_logs
        )

        # ==================================================
        # MEDICINE COST
        # ==================================================

        medicine_logs = StockLog.objects.filter(
            item__farm=farm,
            action="use",
            item__category="medicine",
        )

        if period_start:
            medicine_logs = medicine_logs.filter(
                timestamp__date__gte=period_start
            )

        if period_end:
            medicine_logs = medicine_logs.filter(
                timestamp__date__lte=period_end
            )

        medicine_cost = sum(
            (
                log.quantity_changed
                * log.unit_price_at_time
            )
            for log in medicine_logs
        )

        total_expenses = (
            feed_cost
            + medicine_cost
            + labour_cost
            + utility_cost
            + inventory_cost
        )

        # ==================================================
        # BATCHES
        # ==================================================

        batches = (
            FlockBatch.objects
            .filter(farm=farm)
            .order_by("-id")
        )

        birds = sum(
            b.current_stock
            for b in batches
        )

        mortality = sum(
            b.total_mortality_count
            for b in batches
        )

        total_received = sum(
            b.quantity_received
            for b in batches
        )

        total_chick_cost = Decimal("0")

        calculated_batches = []

        for batch in batches:

            chick_cost = (
                Decimal(batch.quantity_received)
                * batch.chick_cost
            )

            total_chick_cost += chick_cost

            batch_items = (
                OrderItem.objects
                .filter(
                    batch=batch,
                    order__farm=farm
                )
            )

            if period_start:
                batch_items = batch_items.filter(
                    order__created_at__date__gte=period_start
                )

            if period_end:
                batch_items = batch_items.filter(
                    order__created_at__date__lte=period_end
                )

            batch_revenue = (
                batch_items.aggregate(
                    total=Sum(
                        F("quantity")
                        * F("price_per_unit")
                    )
                )["total"]
                or Decimal("0")
            )

            share = (
                Decimal(batch.quantity_received)
                / Decimal(total_received)
                if total_received
                else Decimal("0")
            )

            allocated = (
                feed_cost
                + labour_cost
                + utility_cost
                + medicine_cost
            ) * share

            total_batch_cost = (
                chick_cost
                + allocated
            )

            gross = (
                batch_revenue
                - chick_cost
            )

            net = (
                batch_revenue
                - total_batch_cost
            )

            margin = (
                (net / batch_revenue)
                * Decimal("100")
                if batch_revenue
                else Decimal("0")
            )

            calculated_batches.append({
                "id": batch.id,
                "batch_number": batch.batch_number,
                "revenue": float(batch_revenue),
                "expenses": float(total_batch_cost),
                "gross_profit": float(gross),
                "net_profit": float(net),
                "profit_margin": round(float(margin), 1),
                "birds_count": batch.quantity_received,
                "stock": batch.current_stock,
                "survival_rate": batch.survival_rate,
                "mortality": batch.total_mortality_count,
            })

        # ==================================================
        # FINAL TOTALS
        # ==================================================

        gross_profit = (
            revenue
            - total_chick_cost
        )

        net_profit = (
            gross_profit
            - total_expenses
        )

        profit_margin = (
            (
                net_profit
                / revenue
            )
            * Decimal("100")
            if revenue
            else Decimal("0")
        )

        cash_available = max(
            Decimal("0"),
            paid - total_expenses
        )

        weekly_revenue = (
            orders.filter(
                created_at__gte=last_7_days
            ).aggregate(
                total=Sum("subtotal")
            )["total"]
            or Decimal("0")
        )

        return {
            "summary": {
                "revenue": float(revenue),
                "paid": float(paid),
                "debt": float(debt),
                "expenses": float(total_expenses),
                "gross_profit": float(gross_profit),
                "net_profit": float(net_profit),
                "profit_margin": round(float(profit_margin), 1),
                "cash_available": float(cash_available),
                "orders": orders.count(),
                "birds": birds,
                "mortality": mortality,
                "weekly_revenue": float(weekly_revenue),
                "flock_total_cost": float(total_chick_cost),
            },

            "expense_breakdown": {
                "feed": float(feed_cost),
                "labour": float(labour_cost),
                "utilities": float(utility_cost),
                "medicine": float(medicine_cost),
                "inventory": float(inventory_cost),
            },

            "batches": calculated_batches,

            "weekly_inventory": {},

            "insights": []
        }