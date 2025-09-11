from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.core.cache import cache

# Utility: normalize any cached value into a consistent dict shape
def _normalize_cached_price(cached):
    """Return a dict with latestPrice, change, changePercent, timestamp or None."""
    if isinstance(cached, dict):
        # Ensure required keys exist
        return {
            "latestPrice": cached.get("latestPrice"),
            "change": cached.get("change"),
            "changePercent": cached.get("changePercent"),
            "timestamp": cached.get("timestamp"),
        }
    if isinstance(cached, (int, float)):
        return {
            "latestPrice": float(cached),
            "change": None,
            "changePercent": None,
            "timestamp": None,
        }
    return None

# New endpoint: fetch prices for a list of symbols
@api_view(["GET"])
@permission_classes([AllowAny])
def batch_prices(request):
    user_id = request.GET.get("user_id")
    if user_id:
        symbols = list(InterestedStock.objects.filter(user_id=user_id).values_list('symbol', flat=True))
    else:
        symbols = request.GET.get("symbols")
        if not symbols:
            return Response({"error": "No symbols provided"}, status=400)
        symbols = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    import requests
    from django.conf import settings
    results = []
    for sym in symbols:
        cached = cache.get(f"price:{sym}")
        norm = _normalize_cached_price(cached)
        if norm is not None:
            results.append({"symbol": sym, **norm})
        else:
            # Fetch live data from Finnhub API
            url = f"https://finnhub.io/api/v1/quote?symbol={sym}&token={settings.FINNHUB_API_KEY}"
            try:
                r = requests.get(url, timeout=10)
                data = r.json()
                price = data.get("c")
                prev_price = data.get("pc")
                change = price - prev_price if price is not None and prev_price is not None else None
                change_percent = (change / prev_price * 100) if (change is not None and prev_price) else None
                result = {
                    "symbol": sym,
                    "latestPrice": price,
                    "change": change,
                    "changePercent": change_percent,
                    "timestamp": None,
                }
                results.append(result)
                # Optionally cache the result
                cache.set(f"price:{sym}", result, timeout=300)
            except Exception as e:
                results.append({
                    "symbol": sym,
                    "latestPrice": None,
                    "change": None,
                    "changePercent": None,
                    "timestamp": None,
                    "error": str(e),
                })
    return Response(results)

    
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_interested_prices(request):
    print("[DEBUG] user_interested_prices endpoint called")
    print(f"[DEBUG] request.META: {request.META}")
    print(f"[DEBUG] raw QUERY_STRING: {request.META.get('QUERY_STRING', '')}")
    print(f"[DEBUG] user_id param: {user_id}")
    print(f"[DEBUG] user_id param: {user_id}")
    import urllib.parse
    query_string = request.META.get('QUERY_STRING', '')
    params = urllib.parse.parse_qs(query_string)
    user_id = params.get('user_id', [None])[0]
    if user_id:
        symbols = list(InterestedStock.objects.filter(user_id=user_id).values_list('symbol', flat=True))
        print(f"[DEBUG] symbols for user_id {user_id}: {symbols}")
        if not symbols:
            print(f"[DEBUG] No interested symbols found for user_id {user_id}")
    else:
        user = request.user
        symbols = list(InterestedStock.objects.filter(user=user).values_list('symbol', flat=True))
        print(f"[DEBUG] symbols for request.user {user}: {symbols}")
        if not symbols:
            print(f"[DEBUG] No interested symbols found for request.user {user}")
    results = []
    for sym in symbols:
        print(sym,'----------')
        cached = cache.get(f"price:{sym}")
        norm = _normalize_cached_price(cached)
        if norm is not None:
            results.append({"symbol": sym, **norm})
            print(norm,'--------')
        else:
            results.append({
                "symbol": sym,
                "latestPrice": None,
                "change": None,
                "changePercent": None,
                "timestamp": None,
            })
    return Response(results)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.core.cache import cache

@api_view(["GET"])
@permission_classes([AllowAny])
def prices(request):
    # Accepts ?symbol=TSLA or ?symbols=TSLA,AMZN
    symbol = request.GET.get("symbol")
    symbols = request.GET.get("symbols")
    if symbols:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    elif symbol:
        symbol_list = [symbol.strip().upper()]
    else:
        return JsonResponse({"error": "No symbol(s) provided"}, status=400)

    results = []
    for sym in symbol_list:
        cached = cache.get(f"price:{sym}")
        norm = _normalize_cached_price(cached)
        if norm is not None:
            results.append({"symbol": sym, **norm})
        else:
            # If not in cache, return nulls
            results.append({
                "symbol": sym,
                "latestPrice": None,
                "change": None,
                "changePercent": None,
                "timestamp": None,
            })
    if len(results) == 1:
        return JsonResponse(results[0])
    return JsonResponse(results, safe=False)
import requests
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.conf import settings
# Finnhub stock search endpoint
@require_GET
def finnhub_stock_search(request):
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'results': []})

    api_key = getattr(settings, 'FINNHUB_API_KEY', None)
    if not api_key:
        return JsonResponse({'error': 'Finnhub API key not configured'}, status=500)

    url = f'https://finnhub.io/api/v1/search?q={query}&token={api_key}'
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for item in data.get('result', []):
            # Only include stocks (not funds, indices, etc.)
            if item.get('type') == 'Common Stock':
                results.append({
                    'symbol': item.get('symbol'),
                    'description': item.get('description'),
                    'displaySymbol': item.get('displaySymbol'),
                    'mic': item.get('mic'),
                })
        return JsonResponse({'results': results})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Portfolio, Stock, InterestedStock
from .serializers import (
    PortfolioSerializer, PortfolioCreateSerializer,
    StockSerializer, StockCreateSerializer,
    InterestedStockSerializer
)
from rest_framework import filters


class PortfolioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PortfolioSerializer

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PortfolioCreateSerializer
        return PortfolioSerializer

    @action(detail=True, methods=['get'])
    def stocks(self, request, pk=None):
        portfolio = self.get_object()
        stocks = portfolio.stocks.all()
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        portfolio = self.get_object()
        serializer = StockCreateSerializer(
            data=request.data,
            context={'portfolio_id': portfolio.id}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StockSerializer

    def get_queryset(self):
        return Stock.objects.filter(portfolio__user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return StockCreateSerializer
        return StockSerializer

    def create(self, request, *args, **kwargs):
        portfolio_id = request.data.get('portfolio_id')
        if not portfolio_id:
            return Response(
                {'error': 'portfolio_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        portfolio = get_object_or_404(Portfolio, id=portfolio_id, user=request.user)
        serializer = self.get_serializer(
            data=request.data,
            context={'portfolio_id': portfolio.id}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InterestedStockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InterestedStockSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['symbol', 'name']

    def get_queryset(self):
        return InterestedStock.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        query = request.query_params.get('search', '')
        qs = self.get_queryset().filter(symbol__icontains=query)[:10]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
