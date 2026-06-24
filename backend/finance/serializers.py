from rest_framework import serializers

from .models import (
    Expense,
    Income,
    FinancePeriod,
)

from .services import (
    get_open_period,
    recalculate_period,
)

from accounts.utils import get_user_farm


# =========================================================
# FINANCE PERIOD
# =========================================================
class FinancePeriodSerializer(serializers.ModelSerializer):

    class Meta:
        model = FinancePeriod

        fields = "__all__"

        read_only_fields = [
            "farm",
            "status",
            "total_income",
            "total_expense",
            "closing_balance",
            "created_at",
        ]


# =========================================================
# EXPENSE
# =========================================================
class ExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense

        fields = "__all__"

        read_only_fields = [
            "farm",
            "period",
            "created_at",
        ]

    def create(self, validated_data):

        request = self.context["request"]

        farm = get_user_farm(
            request.user
        )

        validated_data.pop("farm", None)
        validated_data.pop("period", None)

        period = get_open_period(
            farm
        )

        expense = Expense.objects.create(
            farm=farm,
            period=period,
            **validated_data
        )

        recalculate_period(period)

        return expense

# =========================================================
# INCOME
# =========================================================
class IncomeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Income

        fields = "__all__"

        read_only_fields = [
            "farm",
            "period",
            "created_at",
        ]

    def create(self, validated_data):

        request = self.context["request"]

        farm = get_user_farm(
            request.user
        )

        period = get_open_period(
            farm
        )

        income = Income.objects.create(
            farm=farm,
            period=period,
            **validated_data
        )

        recalculate_period(
            period
        )

        return income