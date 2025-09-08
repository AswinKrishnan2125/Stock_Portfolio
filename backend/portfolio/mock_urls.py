from django.urls import path
from .mock_views import mock_prices, mock_alerts, mock_recommendations, historical_prices

urlpatterns = [
    path('prices/', mock_prices, name='mock_prices'),
    path("historical/prices/", historical_prices, name="historical_prices"),
    path('alerts/', mock_alerts, name='mock_alerts'),
    path('', mock_recommendations, name='mock_recommendations'),
]
