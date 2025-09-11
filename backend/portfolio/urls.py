from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, StockViewSet, InterestedStockViewSet, finnhub_stock_search, prices, user_interested_prices, batch_prices
from .mock_views import historical_prices

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet, basename='portfolio')
router.register(r'stocks', StockViewSet, basename='stock')
router.register(r'interested-stocks', InterestedStockViewSet, basename='interestedstock')

urlpatterns = [
    path('batch-prices/', batch_prices, name='batch-prices'),
    path('', include(router.urls)),
    path('prices/', prices, name='prices'),
    path('user-interested-prices/', user_interested_prices, name='user-interested-prices'),
    path('historical/prices/', historical_prices, name='historical-prices'),
    path('search/', finnhub_stock_search, name='finnhub-stock-search'),
]
