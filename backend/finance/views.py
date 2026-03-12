from rest_framework import viewsets, permissions
from .models import Expense, Income
from .serializers import ExpenseSerializer, IncomeSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(farm__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.farm)

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(farm__memberships__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.farm)