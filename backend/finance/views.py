from django.db.models import Sum

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.utils import get_user_farm
from .models import Expense, Income
from .serializers import ExpenseSerializer, IncomeSerializer


# =========================================================
# FINANCE SUMMARY
# =========================================================
class FinanceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="summary")
    def financial_summary(self, request):

        farm = get_user_farm(request.user)

        total_income = Income.objects.filter(farm=farm).aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_expense = Expense.objects.filter(farm=farm).aggregate(
            total=Sum("amount")
        )["total"] or 0

        return Response({
            "total_income": float(total_income),
            "total_expenses": float(total_expense),
            "net_profit": float(total_income - total_expense),
            "currency": "ZAR",
        })


# =========================================================
# EXPENSES
# =========================================================
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        return Expense.objects.filter(farm=farm).order_by("-date")

    def perform_create(self, serializer):
        farm = get_user_farm(self.request.user)
        serializer.save(farm=farm)


# =========================================================
# INCOME
# =========================================================
class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        return Income.objects.filter(farm=farm).order_by("-date")

    def perform_create(self, serializer):
        farm = get_user_farm(self.request.user)
        serializer.save(farm=farm)