from django.db import models
from django.conf import settings


class Alert(models.Model):
    ALERT_TYPES = [
        ("price_above", "Price Above"),
        ("price_below", "Price Below"),
    ]

    user = models.ForeignKey(  # ✅ use custom user model
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alerts"
    )
    symbol = models.CharField(max_length=20)   # e.g. AAPL, MSFT
    target_price = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=ALERT_TYPES)
    enabled = models.BooleanField(default=True)
    triggered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    triggered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} - {self.symbol} {self.type} {self.target_price}"
