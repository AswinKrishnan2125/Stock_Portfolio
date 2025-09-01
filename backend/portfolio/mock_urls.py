from django.urls import path
from .mock_views import mock_prices, mock_alerts, mock_recommendations

urlpatterns = [
    path('prices/', mock_prices, name='mock_prices'),
    path('alerts/', mock_alerts, name='mock_alerts'),
    path('recommendations/', mock_recommendations, name='mock_recommendations'),
]
