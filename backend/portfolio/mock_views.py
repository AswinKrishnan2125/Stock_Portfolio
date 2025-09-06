from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import random
from datetime import datetime, timedelta
import requests
from django.conf import settings 
from django.core.cache import cache
import time
from django.http import JsonResponse
from rest_framework.permissions import AllowAny

from .models import HistoricalPrice


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mock_prices(request):
    """Mock real-time stock prices"""
    symbols = ['AAPL', 'GOOGL']
    
    cached_data = cache.get("stock_prices")
    if cached_data:
        return Response({
            'prices': cached_data,
            'last_updated': datetime.now().isoformat(),
             'cached': True  # helps you know if data came from cache
        })

    prices = []
    for symbol in symbols:
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={settings.ALPHAVANTAGE_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if "Global Quote" in data and data["Global Quote"]:
            quote = data["Global Quote"]

            prices.append({
                'symbol': symbol,
                'current_price': float(quote["05. price"]),
                'change': float(quote["09. change"]),
                'change_percent': quote["10. change percent"],
                'volume': int(quote["06. volume"]),
                'timestamp': datetime.now().isoformat()
            })
        else:
            prices.append({
                'symbol': symbol,
                'error': 'Data not available'
            })

    cache.set("stock_prices", prices, timeout=60)
    return Response({
        'prices': prices,
        'last_updated': datetime.now().isoformat(),
        'cached': False  # helps you know if data came from cache
    })



# @api_view(["GET"])
# @permission_classes([AllowAny])
# def historical_prices(request):
#     symbol = request.GET.get("symbol", "AAPL").upper()
#     range_param = request.GET.get("range", "1M")

#     # Step 1: Try fetching from DB
#     qs = HistoricalPrice.objects.filter(symbol=symbol).order_by("date")
#     print(qs.exists())
#     print(qs.query)
#     if qs.exists():
#         print('Data from DB')
#         candles = [
#             {
#                 "date": hp.date.strftime("%Y-%m-%d"),
#                 "open": hp.open,
#                 "high": hp.high,
#                 "low": hp.low,
#                 "close": hp.close,
#                 "volume": hp.volume,
#             }
#             for hp in qs
#         ]
#     else:
#         # Step 2: Fetch from Alpha Vantage
#         print('Data from API')
#         url = (
#             f"https://www.alphavantage.co/query"
#             f"?function=TIME_SERIES_DAILY"
#             f"&symbol={symbol}"
#             f"&outputsize=compact"
#             f"&apikey={settings.ALPHAVANTAGE_API_KEY}"
#         )
#         r = requests.get(url, timeout=15)
#         data = r.json()

#         if "Time Series (Daily)" not in data:
#             return JsonResponse({"prices": {symbol: []}, "error": "No data"}, status=200)

#         time_series = data["Time Series (Daily)"]
#         candles = []

#         for date_str, values in time_series.items():
#             date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
#             hp, created = HistoricalPrice.objects.get_or_create(
#                 symbol=symbol,
#                 date=date_obj,
#                 defaults={
#                     "open": float(values["1. open"]),
#                     "high": float(values["2. high"]),
#                     "low": float(values["3. low"]),
#                     "close": float(values["4. close"]),
#                     "volume": int(values["5. volume"]),
#                 },
#             )
#             candles.append({
#                 "date": date_str,
#                 "open": hp.open,
#                 "high": hp.high,
#                 "low": hp.low,
#                 "close": hp.close,
#                 "volume": hp.volume,
#             })

#         candles.sort(key=lambda x: x["date"])

#     # Step 3: Apply range filter
#     if range_param == "1M":
#         candles = candles[-30:]
#     elif range_param == "3M":
#         candles = candles[-90:]
#     elif range_param == "6M":
#         candles = candles[-180:]

#     return JsonResponse({"prices": {symbol: candles}})




@api_view(["GET"])
@permission_classes([AllowAny])
def historical_prices(request):
    symbol = request.GET.get("symbol", "AAPL").upper()
    range_param = request.GET.get("range", "1M")

    # Always keep 100 days in DB
    MAX_DAYS = 100  

    qs = HistoricalPrice.objects.filter(symbol=symbol).order_by("date")

    if qs.exists():
        print("Data from DB")

        latest_date_in_db = qs.last().date
        today = datetime.today().date()

        if latest_date_in_db < today:
            # Fetch the most recent day from Alpha Vantage
            url = (
                f"https://www.alphavantage.co/query"
                f"?function=TIME_SERIES_DAILY"
                f"&symbol={symbol}"
                f"&outputsize=compact"
                f"&apikey={settings.ALPHAVANTAGE_API_KEY}"
            )
            r = requests.get(url, timeout=15)
            data = r.json()

            if "Time Series (Daily)" in data:
                time_series = data["Time Series (Daily)"]

                # Find the most recent trading day from API
                latest_date_str = max(time_series.keys())
                values = time_series[latest_date_str]
                date_obj = datetime.strptime(latest_date_str, "%Y-%m-%d").date()

                if date_obj > latest_date_in_db:
                    # Insert the new day
                    HistoricalPrice.objects.create(
                        symbol=symbol,
                        date=date_obj,
                        open=float(values["1. open"]),
                        high=float(values["2. high"]),
                        low=float(values["3. low"]),
                        close=float(values["4. close"]),
                        volume=int(values["5. volume"]),
                    )

                    # --- Delete only the oldest record if count > 100 ---
                    count = HistoricalPrice.objects.filter(symbol=symbol).count()
                    if count > MAX_DAYS:
                        oldest = (
                            HistoricalPrice.objects.filter(symbol=symbol)
                            .order_by("date")
                            .first()
                        )
                        if oldest:
                            oldest.delete()

        # Refresh queryset
        qs = HistoricalPrice.objects.filter(symbol=symbol).order_by("date")

    else:
        print("Data from API (initial load)")
        url = (
            f"https://www.alphavantage.co/query"
            f"?function=TIME_SERIES_DAILY"
            f"&symbol={symbol}"
            f"&outputsize=compact"
            f"&apikey={settings.ALPHAVANTAGE_API_KEY}"
        )
        r = requests.get(url, timeout=15)
        data = r.json()

        if "Time Series (Daily)" not in data:
            return JsonResponse({"prices": {symbol: []}, "error": "No data"}, status=200)

        time_series = data["Time Series (Daily)"]

        # Insert up to 100 days (most recent first)
        for date_str, values in list(time_series.items())[:MAX_DAYS]:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            HistoricalPrice.objects.get_or_create(
                symbol=symbol,
                date=date_obj,
                defaults={
                    "open": float(values["1. open"]),
                    "high": float(values["2. high"]),
                    "low": float(values["3. low"]),
                    "close": float(values["4. close"]),
                    "volume": int(values["5. volume"]),
                },
            )

        qs = HistoricalPrice.objects.filter(symbol=symbol).order_by("date")

    # Build response candles
    candles = [
        {
            "date": hp.date.strftime("%Y-%m-%d"),
            "open": hp.open,
            "high": hp.high,
            "low": hp.low,
            "close": hp.close,
            "volume": hp.volume,
        }
        for hp in qs
    ]

    # Range filter for frontend (but DB always has 100)
    if range_param == "1M":
        candles = candles[-30:]
    elif range_param == "3M":
        candles = candles[-90:]
    elif range_param == "6M":
        candles = candles[-180:]

    return JsonResponse({"prices": {symbol: candles}})








@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mock_alerts(request):
    """Mock price alerts"""
    alerts = [
        {
            'id': 1,
            'symbol': 'AAPL',
            'type': 'price_above',
            'target_price': 150.00,
            'current_price': 152.30,
            'triggered': True,
            'message': 'AAPL has exceeded your target price of $150.00',
            'created_at': (datetime.now() - timedelta(hours=2)).isoformat(),
            'triggered_at': (datetime.now() - timedelta(minutes=30)).isoformat()
        },
        {
            'id': 2,
            'symbol': 'TSLA',
            'type': 'price_below',
            'target_price': 200.00,
            'current_price': 195.50,
            'triggered': True,
            'message': 'TSLA has dropped below your target price of $200.00',
            'created_at': (datetime.now() - timedelta(hours=5)).isoformat(),
            'triggered_at': (datetime.now() - timedelta(hours=1)).isoformat()
        },
        {
            'id': 3,
            'symbol': 'GOOGL',
            'type': 'price_above',
            'target_price': 2800.00,
            'current_price': 2750.00,
            'triggered': False,
            'message': 'GOOGL is approaching your target price of $2800.00',
            'created_at': (datetime.now() - timedelta(days=1)).isoformat(),
            'triggered_at': None
        }
    ]
    
    return Response({
        'alerts': alerts,
        'total_alerts': len(alerts),
        'active_alerts': len([a for a in alerts if a['triggered']])
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mock_recommendations(request):
    """Mock AI stock recommendations"""
    recommendations = [
        {
            'id': 1,
            'symbol': 'AAPL',
            'company_name': 'Apple Inc.',
            'recommendation': 'BUY',
            'confidence_score': 85,
            'reasoning': 'Strong Q4 earnings, new product launches, and expanding services revenue. Technical indicators show bullish momentum.',
            'target_price': 165.00,
            'current_price': 152.30,
            'potential_return': 8.3,
            'risk_level': 'LOW',
            'time_horizon': '3-6 months',
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 2,
            'symbol': 'NVDA',
            'company_name': 'NVIDIA Corporation',
            'recommendation': 'STRONG_BUY',
            'confidence_score': 92,
            'reasoning': 'AI chip demand continues to surge, market leadership in GPU technology, and strong partnerships with major tech companies.',
            'target_price': 850.00,
            'current_price': 720.50,
            'potential_return': 18.0,
            'risk_level': 'MEDIUM',
            'time_horizon': '6-12 months',
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 3,
            'symbol': 'TSLA',
            'company_name': 'Tesla, Inc.',
            'recommendation': 'HOLD',
            'confidence_score': 65,
            'reasoning': 'Mixed signals from production numbers and market competition. Wait for clearer direction on autonomous driving progress.',
            'target_price': 210.00,
            'current_price': 195.50,
            'potential_return': 7.4,
            'risk_level': 'HIGH',
            'time_horizon': '6-12 months',
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 4,
            'symbol': 'META',
            'company_name': 'Meta Platforms, Inc.',
            'recommendation': 'BUY',
            'confidence_score': 78,
            'reasoning': 'Strong advertising revenue recovery, successful pivot to AI and VR, and improving user engagement metrics.',
            'target_price': 380.00,
            'current_price': 340.20,
            'potential_return': 11.7,
            'risk_level': 'MEDIUM',
            'time_horizon': '3-6 months',
            'created_at': datetime.now().isoformat()
        },
        {
            'id': 5,
            'symbol': 'AMZN',
            'company_name': 'Amazon.com, Inc.',
            'recommendation': 'BUY',
            'confidence_score': 82,
            'reasoning': 'AWS growth accelerating, e-commerce market share expanding, and cost optimization initiatives showing results.',
            'target_price': 180.00,
            'current_price': 165.80,
            'potential_return': 8.5,
            'risk_level': 'LOW',
            'time_horizon': '6-12 months',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    return Response({
        'recommendations': recommendations,
        'total_recommendations': len(recommendations),
        'buy_recommendations': len([r for r in recommendations if 'BUY' in r['recommendation']]),
        'last_updated': datetime.now().isoformat()
    })
