import os
import json
import redis
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Portfolio, HistoricalStock

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
REDIS_CLIENT = redis.Redis(host="localhost", port=6379, decode_responses=True)

@method_decorator(csrf_exempt, name="dispatch")
class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        portfolio = request.data.get("portfolio", [])
        filters = request.data.get("filters", {})

        # fetch historical data
        history = list(
            HistoricalStock.objects.values("symbol", "date", "close_price")
        )

        # fetch latest prices from redis
        live_prices = {}
        for symbol in [p["symbol"] for p in portfolio]:
            live_prices[symbol] = REDIS_CLIENT.get(symbol)

        # prepare context for LLM
        prompt = {
            "portfolio": portfolio,
            "historical_data": history[:100],  # limit size
            "live_prices": live_prices,
            "filters": filters
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        body = {
            "model": "openchat/openchat-3.5-0106",  # free model
            "messages": [
                {"role": "system", "content": "You are an AI stock advisor."},
                {"role": "user", "content": f"Analyze this data and return JSON recommendations: {json.dumps(prompt)}"}
            ]
        }

        llm_response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=body
        )

        try:
            content = llm_response.json()["choices"][0]["message"]["content"]
            recommendations = json.loads(content)  # ensure AI outputs JSON
        except Exception:
            recommendations = []

        return JsonResponse({"recommendations": recommendations}, safe=False)
