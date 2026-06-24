from decimal import Decimal

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.utils import get_user_farm
from accounts.permissions import FinancePermission

from .models import (
    Expense,
    Income,
    FinancePeriod,
)

from .serializers import (
    ExpenseSerializer,
    IncomeSerializer,
    FinancePeriodSerializer,
)

from .services import (
    get_open_period,
    recalculate_period,
    close_period,
)


# =========================================================
# FINANCE
# =========================================================
class FinanceViewSet(viewsets.ViewSet):

    permission_classes = [
        FinancePermission
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="summary"
    )
    def financial_summary(self, request):

        farm = get_user_farm(
            request.user
        )

        period = get_open_period(
            farm
        )

        recalculate_period(
            period
        )

        # Refresh values after recalculation
        period.refresh_from_db()

        return Response({

            "period":
                FinancePeriodSerializer(
                    period
                ).data,

            "total_income":
                float(
                    period.total_income or 0
                ),

            "total_expenses":
                float(
                    period.total_expense or 0
                ),

            "cash_out":
                float(
                    period.cash_out or 0
                ),

            "net_profit":
                (
                    float(
                        period.total_income or 0
                    )
                    -
                    float(
                        period.total_expense or 0
                    )
                ),

            "currency":
                "ZAR",
        })

    @action(
        detail=False,
        methods=["post"],
        url_path="close-week"
    )
    def close_week(self, request):

        farm = get_user_farm(
            request.user
        )

        period = get_open_period(
            farm
        )

        # IMPORTANT:
        # Keep everything as Decimal
        cash_out = Decimal(
            str(
                request.data.get(
                    "cash_out",
                    "0"
                )
            )
        )

        recalculate_period(
            period
        )

        period.refresh_from_db()

        new_period = close_period(
            period,
            cash_out
        )

        return Response({

            "message":
                "Finance week closed successfully",

            "closed_period":
                FinancePeriodSerializer(
                    period
                ).data,

            "new_period":
                FinancePeriodSerializer(
                    new_period
                ).data,
        })

    @action(
        detail=False,
        methods=["get"],
        url_path="history"
    )
    def history(self, request):

        farm = get_user_farm(
            request.user
        )

        periods = (
            FinancePeriod.objects
            .filter(
                farm=farm
            )
            .order_by(
                "-start_date"
            )
        )

        return Response(

            FinancePeriodSerializer(
                periods,
                many=True
            ).data
        )


# =========================================================
# EXPENSES
# =========================================================
class ExpenseViewSet(
    viewsets.ModelViewSet
):

    serializer_class = (
        ExpenseSerializer
    )

    permission_classes = [
        FinancePermission
    ]

    def get_queryset(self):

        farm = get_user_farm(
            self.request.user
        )

        queryset = (
            Expense.objects
            .filter(
                farm=farm
            )
        )

        period = (
            self.request.query_params
            .get(
                "period"
            )
        )

        if period:

            queryset = (
                queryset.filter(
                    period_id=period
                )
            )

        return queryset.order_by(
            "-date"
        )

    def perform_create(
        self,
        serializer
    ):
        # serializer assigns farm + period
        serializer.save()


# =========================================================
# INCOME
# =========================================================
class IncomeViewSet(
    viewsets.ModelViewSet
):

    serializer_class = (
        IncomeSerializer
    )

    permission_classes = [
        FinancePermission
    ]

    def get_queryset(self):

        farm = get_user_farm(
            self.request.user
        )

        queryset = (
            Income.objects
            .filter(
                farm=farm
            )
        )

        period = (
            self.request.query_params
            .get(
                "period"
            )
        )

        if period:

            queryset = (
                queryset.filter(
                    period_id=period
                )
            )

        return queryset.order_by(
            "-date"
        )

    def perform_create(
        self,
        serializer
    ):
        # serializer assigns farm + period
        serializer.save()