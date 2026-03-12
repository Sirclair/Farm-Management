from datetime import date, timedelta
from flock.models import DailyRecord, FlockBatch


def mortality_alerts(farm):
    """
    Detect abnormal mortality spikes.
    Alert if daily mortality exceeds 3% of current flock.
    """

    alerts = []

    batches = FlockBatch.objects.filter(farm=farm)

    for batch in batches:

        today_record = DailyRecord.objects.filter(
            flock=batch,
            date=date.today()
        ).first()

        if not today_record:
            continue

        if batch.current_stock == 0:
            continue

        mortality_rate = (today_record.mortality / batch.current_stock) * 100

        if mortality_rate >= 3:
            alerts.append({
                "type": "mortality",
                "batch": batch.batch_number,
                "message": f"High mortality detected in {batch.batch_number}",
                "mortality_rate": round(mortality_rate, 2)
            })

    return alerts


def feed_efficiency_alerts(farm):
    """
    Detect poor feed conversion ratio.
    """

    alerts = []

    batches = FlockBatch.objects.filter(farm=farm)

    for batch in batches:

        fcr = batch.feed_conversion_ratio

        if fcr == 0:
            continue

        if fcr > 2.0:
            alerts.append({
                "type": "feed",
                "batch": batch.batch_number,
                "message": f"Poor feed efficiency detected in {batch.batch_number}",
                "fcr": fcr
            })

    return alerts


def farm_alerts(farm):
    """
    Combine all alerts
    """

    alerts = []

    alerts.extend(mortality_alerts(farm))
    alerts.extend(feed_efficiency_alerts(farm))

    return alerts