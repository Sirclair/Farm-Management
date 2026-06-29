from datetime import date
from django.db.models import Sum
from django.utils import timezone

from .models import (
    FinancePeriod,
    Expense,
    Income,
)


def get_open_period(farm):
    """
    Return active finance period.
    Create one if none exists.
    """

    period = (
        FinancePeriod.objects
        .filter(
            farm=farm,
            status="open"
        )
        .first()
    )

    if period:
        return period

    # Use an explicit start-date naming scheme for on-demand flexibility
    session_date = date.today().strftime("%d %b %Y")

    return FinancePeriod.objects.create(
        farm=farm,
        name=f"Session starting {session_date}",
        start_date=date.today(),
        status="open",
    )


def recalculate_period(period):
    """
    Recalculate totals for a finance period.
    """

    income = (
        Income.objects
        .filter(period=period)
        .aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )

    expense = (
        Expense.objects
        .filter(period=period)
        .aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )

    period.total_income = income
    period.total_expense = expense

    period.closing_balance = (
        period.opening_balance
        + income
        - expense
        - period.cash_out
    )

    period.save()

    return period


def close_period(period, cash_out=0):
    """
    Close current financial cycle and instantly initialize the next on-demand slate.
    """

    recalculate_period(period)

    period.cash_out = cash_out
    period.status = "closed"
    period.end_date = date.today()
    period.closed_at = timezone.now()

    period.closing_balance = (
        period.opening_balance
        + period.total_income
        - period.total_expense
        - cash_out
    )

    period.save()

    # Generate next dynamic start-date string stamp
    next_session_date = date.today().strftime("%d %b %Y")

    return FinancePeriod.objects.create(
        farm=period.farm,
        name=f"Session starting {next_session_date}",
        opening_balance=period.closing_balance,
        start_date=date.today(),
        status="open",
    )