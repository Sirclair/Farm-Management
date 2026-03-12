from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlockBatchViewSet, DailyRecordViewSet

router = DefaultRouter()
router.register(r'batches', FlockBatchViewSet, basename='flockbatch')
router.register(r'daily-records', DailyRecordViewSet, basename='dailyrecord')

urlpatterns = [
    path('', include(router.urls)),
]