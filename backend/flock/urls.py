from rest_framework.routers import DefaultRouter

from .views import (
    FlockBatchViewSet,
    DailyRecordViewSet,
    StockAdjustmentViewSet,
)

router = DefaultRouter()

router.register(r"batches", FlockBatchViewSet, basename="batches")
router.register(r"daily-records", DailyRecordViewSet, basename="daily-records")
router.register(
    r"stock-adjustments",
    StockAdjustmentViewSet,
    basename="stock-adjustments"
)

urlpatterns = router.urls