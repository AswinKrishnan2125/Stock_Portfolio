# alerts/utils.py

import asyncio
import json
import websockets
from django.utils.timezone import now
from django.conf import settings
from django.core.cache import cache
from .models import Alert
from channels.db import database_sync_to_async

FINNHUB_WS_URL = f"wss://ws.finnhub.io?token={settings.FINNHUB_API_KEY}"


async def price_stream(user):
    """
    Stream prices from Finnhub, compare with alerts.
    - Prefer live price
    - If no live price, use Redis cache
    """
    async with websockets.connect(FINNHUB_WS_URL) as ws:
        # Subscribe to all symbols that have active alerts
        symbols = await database_sync_to_async(lambda: list(
            Alert.objects.filter(user=user, enabled=True, triggered=False)
            .values_list("symbol", flat=True)
            .distinct()
        ))()
        for sym in symbols:
            await ws.send(json.dumps({"type": "subscribe", "symbol": sym}))

        while True:
            msg = await ws.recv()
            data = json.loads(msg)

            if data.get("type") == "trade":
                for trade in data["data"]:
                    symbol = trade["s"]
                    live_price = float(trade["p"])

                    # ✅ update Redis cache with latest known price
                    # cache.set(f"price:{symbol}", live_price, timeout=60)

                    # ✅ check all alerts for this symbol
                    alerts = await database_sync_to_async(lambda: list(
                        Alert.objects.filter(
                            user=user,
                            symbol=symbol,
                            enabled=True,
                            triggered=False
                        )
                    ))()

                    for alert in alerts:
                        target = float(alert.target_price)

                        # Always prefer live price, else fall back to cache
                        current_price = live_price or cache.get(f"price:{symbol}")

                        if current_price is None:
                            continue  # no price yet

                        triggered = False
                        if alert.type == "price_above" and current_price >= target:
                            triggered = True
                        elif alert.type == "price_below" and current_price <= target:
                            triggered = True

                        if triggered:
                            alert.triggered = True
                            alert.triggered_at = now()
                            await database_sync_to_async(alert.save)()
                        
                        print(f"Checking alert: symbol={symbol}, type={alert.type}, current_price={current_price}, target={target}")

                            # TODO: push event to frontend WebSocket for instant notifications
                            # Example: await ws.send(json.dumps({
                            #   "type": "alert_triggered",
                            #   "alert_id": alert.id,
                            #   "symbol": symbol,
                            #   "current_price": current_price,
                            #   "target_price": target,
                            #   "triggered_at": str(alert.triggered_at),
                            # }))
