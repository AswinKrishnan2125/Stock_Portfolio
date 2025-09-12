import os
import json
import requests
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from portfolio.models import Portfolio, Stock, InterestedStock, HistoricalPrice

from django.conf import settings

OPENROUTER_API_KEY = getattr(settings, "OPENROUTER_API_KEY", os.getenv("OPENROUTER_API_KEY"))
OPENROUTER_MODEL = getattr(settings, "OPENROUTER_MODEL", os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3.1:free"))
OPENROUTER_REFERER = getattr(settings, "OPENROUTER_REFERER", "http://localhost:8000")
OPENROUTER_TITLE = getattr(settings, "OPENROUTER_TITLE", "StockTracker")
RECS_CACHE_TTL = int(os.getenv("RECS_CACHE_TTL", "600"))  # 10 minutes default


def _get_user_holdings(user):
    # Aggregate all stocks across user portfolios
    holdings = []
    portfolios = Portfolio.objects.filter(user=user).prefetch_related("stocks")
    for p in portfolios:
        for s in p.stocks.all():
            holdings.append({
                "symbol": s.symbol,
                "company_name": s.company_name,
                "shares": float(s.shares),
                "purchase_price": float(s.purchase_price),
                "purchase_date": s.purchase_date.isoformat() if s.purchase_date else None,
            })
    return holdings


def _get_user_interests(user):
    syms = list(InterestedStock.objects.filter(user=user).values_list("symbol", flat=True))
    return [s.upper() for s in syms]


def _get_live_price_from_cache(symbol):
    cached = cache.get(f"price:{symbol.upper()}")
    if isinstance(cached, dict):
        return cached.get("latestPrice")
    if isinstance(cached, (int, float)):
        return float(cached)
    return None


def _get_recent_history(symbol, days=30):
    start_date = datetime.utcnow().date() - timedelta(days=days + 5)
    qs = HistoricalPrice.objects.filter(symbol=symbol.upper(), date__gte=start_date).order_by("date")
    return [
        {
            "date": hp.date.isoformat(),
            "open": hp.open,
            "high": hp.high,
            "low": hp.low,
            "close": hp.close,
            "volume": hp.volume,
        }
        for hp in qs
    ]


def _build_prompt(user):
    holdings = _get_user_holdings(user)
    interests = _get_user_interests(user)
    all_symbols = sorted({*(h["symbol"] for h in holdings), *interests})

    # Live prices snapshot
    live_prices = {sym: _get_live_price_from_cache(sym) for sym in all_symbols}

    # Small recent history subset to control token usage
    history = {sym: _get_recent_history(sym, days=30) for sym in all_symbols}

    # Explicit instruction for structured JSON output
    system = (
        "You are an expert equity analyst. Return STRICT valid JSON only.\n"
        "JSON structure: {\n"
        "  \"holdings\": [ {symbol, company_name?, recommendation, target_price, current_price?, risk_level, confidence_score, time_horizon, reasoning} ],\n"
        "  \"suggestions\": [ {symbol, recommendation, target_price, risk_level, confidence_score, time_horizon, reasoning} ]\n"
        "}.\n"
        "Requirements:\n"
        "- For every user holding, provide a recommendation.\n"
        "- Add 3-5 extra suggestions based on interested symbols or close peers.\n"
        "- Reasoning must reference market conditions from recent_history: trend over last 30 days, notable volatility, breakouts/breakdowns vs simple moving average, and sector context if apparent.\n"
        "- Avoid generic phrases like 'Based on your interests and recent price context.'. Provide 2-3 specific, concise sentences.\n"
        "- Provide numeric target_price (USD), risk_level in {LOW,MEDIUM,HIGH}, confidence_score (0-100) calibrated to strength of evidence, and time_horizon like '3M' or '6M'."
    )

    user_msg = {
        "portfolio_holdings": holdings,
        "interested_symbols": interests,
        "live_prices": live_prices,
        "recent_history": history,
    }

    return system, user_msg


def _call_openrouter(system_prompt, user_payload):
    try:
        if not OPENROUTER_API_KEY:
            return {"error": "Missing OPENROUTER_API_KEY"}
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Optional but recommended by OpenRouter for routing/metrics
            "HTTP-Referer": OPENROUTER_REFERER,
            "X-Title": OPENROUTER_TITLE,
        }
        body = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            "temperature": 0.3,
            # Encourage strict JSON from supported models
            "response_format": {"type": "json_object"},
        }
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"].get("content")
        if not content:
            return {"error": "Empty response content from model"}
        # Some models wrap JSON in code fences; strip if present
        txt = content.strip()
        if txt.startswith("```"):
            txt = txt.strip("`")
            if txt.lower().startswith("json"):
                txt = txt[4:].strip()
        # Try direct JSON
        try:
            return json.loads(txt)
        except Exception:
            # Try to extract first {...} block
            start = txt.find("{")
            end = txt.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(txt[start : end + 1])
            raise
    except Exception as e:
        # Bubble up error message to help diagnose instead of silent None
        return {"error": str(e)}


@method_decorator(csrf_exempt, name="dispatch")
class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return cached recommendations if available; do not call model
        cache_key = f"recs:{request.user.id}"
        cached = cache.get(cache_key)
        if cached:
            cached_out = {**cached, "cached": True}
            return JsonResponse(cached_out, safe=False)
        return JsonResponse({"recommendations": [], "cached": False})

    def post(self, request):
        # Only on explicit refresh should we call the model
        force = bool(request.data.get("force", False))
        filters = request.data.get("filters", {})
        cache_key = f"recs:{request.user.id}"

        if not force:
            cached = cache.get(cache_key)
            if cached:
                return JsonResponse({**cached, "cached": True}, safe=False)

        try:
            system_prompt, user_payload = _build_prompt(request.user)
            result = _call_openrouter(system_prompt, user_payload)

            # Normalize to a flat list expected by frontend while preserving sections
            now_iso = datetime.utcnow().isoformat() + "Z"
            # If model call failed, attach error but avoid silent rule-based fallback unless forced
            if result is None or (isinstance(result, dict) and result.get("error")):
                holdings_list = []
                suggestions_list = []
                model_error = result.get("error") if isinstance(result, dict) else "Model returned no result"
            else:
                # Accept alternative shapes from models and normalize
                if isinstance(result, dict) and isinstance(result.get("recommendations"), list):
                    flat = result.get("recommendations", [])
                    holdings_list = flat
                    suggestions_list = []
                else:
                    holdings_list = result.get("holdings", [])
                    suggestions_list = result.get("suggestions", [])
                model_error = None

            live_prices_snapshot = user_payload.get("live_prices", {})

            def _to_float(val):
                try:
                    if val is None:
                        return None
                    return float(val)
                except Exception:
                    return None

            def _norm(item, section):
                sym = item.get("symbol")
                cp = item.get("current_price")
                if (cp is None) and sym:
                    cp = live_prices_snapshot.get(sym)
                tp = item.get("target_price")
                return {
                    "id": f"{section}:{sym or '?'}",
                    "section": section,
                    "symbol": sym,
                    "company_name": item.get("company_name"),
                    "recommendation": item.get("recommendation", "HOLD"),
                    "target_price": _to_float(tp),
                    "current_price": _to_float(cp),
                    "risk_level": item.get("risk_level", "MEDIUM"),
                    "confidence_score": item.get("confidence_score", 50),
                    "time_horizon": item.get("time_horizon", "3M"),
                    "reasoning": item.get("reasoning", ""),
                    "created_at": now_iso,
                }

            recommendations = [_norm(i, "holding") for i in holdings_list] + [
                _norm(i, "suggestion") for i in suggestions_list
            ]

            # If model failed or returned nothing, build a rule-based fallback with real signals
            source = "model"
            if not recommendations:
                # Holdings from user payload; interests list
                hp = user_payload.get("portfolio_holdings", [])
                interests = user_payload.get("interested_symbols", [])
                live_prices = user_payload.get("live_prices", {})
                history = user_payload.get("recent_history", {})

                def analyze(sym):
                    arr = history.get(sym, [])
                    closes = [x.get("close") for x in arr if isinstance(x.get("close"), (int, float))]
                    if len(closes) < 5:
                        return {
                            "trend": 0,
                            "vol": 0,
                            "sma": None,
                            "reason": "Insufficient data; neutral stance.",
                            "conf": 50,
                        }
                    trend = (closes[-1] - closes[0]) / closes[0] * 100
                    import statistics
                    vol = statistics.pstdev(closes[-10:]) if len(closes) >= 10 else statistics.pstdev(closes)
                    sma = sum(closes[-20:]) / min(20, len(closes))
                    last = closes[-1]
                    above_sma = last > sma
                    # Confidence calibrated by absolute trend and inverse volatility
                    base = max(0, min(100, 50 + trend / 2))
                    conf = max(30, min(90, base - min(20, vol)))
                    if trend > 5 and above_sma:
                        reason = f"Uptrend (~{trend:.1f}%), price above ~{int(sma)} SMA; momentum positive."
                    elif trend < -5 and not above_sma:
                        reason = f"Downtrend (~{trend:.1f}%), price below ~{int(sma)} SMA; momentum weak."
                    else:
                        reason = f"Sideways trend (~{trend:.1f}%), consolidating near SMA ~{int(sma)}."
                    return {"trend": trend, "vol": vol, "sma": sma, "reason": reason, "conf": int(conf)}

                for h in hp:
                    sym = h.get("symbol")
                    cp = live_prices.get(sym)
                    tp = cp * 1.1 if isinstance(cp, (int, float)) else None
                    sig = analyze(sym)
                    recommendations.append({
                        "id": f"holding:{sym}",
                        "section": "holding",
                        "symbol": sym,
                        "company_name": h.get("company_name"),
                        "recommendation": "BUY" if sig["trend"] > 5 else ("SELL" if sig["trend"] < -5 else "HOLD"),
                        "target_price": tp,
                        "current_price": cp,
                        "risk_level": "LOW" if sig["vol"] < 2 else ("HIGH" if sig["vol"] > 5 else "MEDIUM"),
                        "confidence_score": sig["conf"],
                        "time_horizon": "3M",
                        "reasoning": sig["reason"],
                        "created_at": now_iso,
                    })
                extra = [s for s in interests if s not in {h.get("symbol") for h in hp}][:5]
                for sym in extra:
                    cp = live_prices.get(sym)
                    tp = cp * 1.15 if isinstance(cp, (int, float)) else None
                    sig = analyze(sym)
                    recommendations.append({
                        "id": f"suggestion:{sym}",
                        "section": "suggestion",
                        "symbol": sym,
                        "company_name": None,
                        "recommendation": "BUY" if sig["trend"] > 5 else ("SELL" if sig["trend"] < -5 else "WATCH"),
                        "target_price": tp,
                        "current_price": cp,
                        "risk_level": "LOW" if sig["vol"] < 2 else ("HIGH" if sig["vol"] > 5 else "MEDIUM"),
                        "confidence_score": sig["conf"],
                        "time_horizon": "3M",
                        "reasoning": sig["reason"],
                        "created_at": now_iso,
                    })
                source = "fallback"

            # compute potential_return if possible
            for rec in recommendations:
                try:
                    tp = rec.get("target_price")
                    cp = rec.get("current_price")
                    if tp is not None and cp is not None and cp != 0:
                        rec["potential_return"] = round(((tp - cp) / cp) * 100, 2)
                    else:
                        rec["potential_return"] = 0
                except Exception:
                    rec["potential_return"] = 0

            payload = {"recommendations": recommendations, "cached": False, "generated_at": now_iso, "source": source}
            if model_error:
                payload["model_error"] = model_error
            cache.set(cache_key, payload, timeout=RECS_CACHE_TTL)
            return JsonResponse(payload, safe=False)
        except Exception as e:
            # Fall back to cache if exists
            cached = cache.get(cache_key)
            if cached:
                return JsonResponse({**cached, "error": str(e)}, safe=False, status=200)
            return JsonResponse({"recommendations": [], "error": str(e)}, status=500)
