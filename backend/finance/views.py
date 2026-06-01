from django.db.models import Sum

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Expense, Income
from .serializers import (
    ExpenseSerializer,
    IncomeSerializer,
)


# =========================================================
# FINANCE SUMMARY
# =========================================================

class FinanceViewSet(viewsets.ViewSet):

    permission_classes = [permissions.IsAuthenticated]

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def financial_summary(self, request):

        farm = request.user.active_farm

        if not farm:
            return Response(
                {"error": "Farm not found"},
                status=404,
            )

        total_income = (
            Income.objects.filter(
                farm=farm
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        total_expense = (
            Expense.objects.filter(
                farm=farm
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        net_profit = (
            total_income
            - total_expense
        )

        return Response({
            "total_income": float(total_income),
            "total_expenses": float(total_expense),
            "net_profit": float(net_profit),
            "currency": "ZAR",
        })


# =========================================================
# EXPENSES
# =========================================================

class ExpenseViewSet(viewsets.ModelViewSet):

    serializer_class = ExpenseSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        farm = self.request.user.active_farm

        if not farm:
            return Expense.objects.none()

        return Expense.objects.filter(
            farm=farm
        ).order_by("-date")

    def perform_create(self, serializer):

        serializer.save(
            farm=self.request.user.active_farm
        )


# =========================================================
# INCOME
# =========================================================

class IncomeViewSet(viewsets.ModelViewSet):

    serializer_class = IncomeSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        farm = self.request.user.active_farm

        if not farm:
            return Income.objects.none()

        return Income.objects.filter(
            farm=farm
        ).order_by("-date")

    def perform_create(self, serializer):

        serializer.save(
            farm=self.request.user.active_farm
        )