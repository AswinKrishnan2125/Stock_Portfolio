from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import random
from datetime import datetime, timedelta
import requests
from django.conf import settings 


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mock_prices(request):
    """Mock real-time stock prices"""
    symbols = ['AAPL', 'GOOGL']
    
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

    return Response({
        'prices': prices,
        'last_updated': datetime.now().isoformat()
    })


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
