from django.db import models
from django.conf import settings


class Portfolio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolios')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s {self.name}"

    class Meta:
        ordering = ['-created_at']


class Stock(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='stocks')
    symbol = models.CharField(max_length=10)
    company_name = models.CharField(max_length=200)
    shares = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateField()
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} - {self.shares} shares"

    @property
    def total_value(self):
        if self.current_price:
            return self.shares * self.current_price
        return self.shares * self.purchase_price

    @property
    def gain_loss(self):
        if self.current_price:
            return (self.current_price - self.purchase_price) * self.shares
        return 0

    @property
    def gain_loss_percentage(self):
        if self.purchase_price and self.current_price:
            return ((self.current_price - self.purchase_price) / self.purchase_price) * 100
        return 0

    class Meta:
        ordering = ['-created_at']
        unique_together = ['portfolio', 'symbol']



class HistoricalPrice(models.Model):
    symbol = models.CharField(max_length=20, db_index=True)
    date = models.DateField(db_index=True)
    open = models.FloatField()
    high = models.FloatField()
    low = models.FloatField()
    close = models.FloatField()
    volume = models.BigIntegerField()

    class Meta:
        unique_together = ("symbol", "date")  # prevent duplicates
        ordering = ["date"]

    def __str__(self):
        return f"{self.symbol} - {self.date}"


class InterestedStock(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interested_stocks")
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=100, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'symbol')

    def __str__(self):
        return f"{self.user} - {self.symbol}"