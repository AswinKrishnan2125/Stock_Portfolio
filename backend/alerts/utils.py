import asyncio
import json
import websockets
from django.utils.timezone import now
from .models import Alert
from django.conf import settings

FINNHUB_WS_URL = "wss://ws.finnhub.io?token={settings.FINNHUB_API_KEY}"

async def price_stream():
    async with websockets.connect(FINNHUB_WS_URL) as ws:
        # Subscribe to all active alert symbols
        symbols = Alert.objects.filter(enabled=True, triggered=False).values_list("symbol", flat=True).distinct()
        for sym in symbols:
            await ws.send(json.dumps({"type": "subscribe", "symbol": sym}))

        while True:
            msg = await ws.recv()
            data = json.loads(msg)

            if data.get("type") == "trade":
                for trade in data["data"]:
                    symbol = trade["s"]
                    price = trade["p"]

                    # Check alerts in DB for this symbol
                    alerts = Alert.objects.filter(symbol=symbol, enabled=True, triggered=False)
                    for alert in alerts:
                        if alert.type == "price_above" and price >= float(alert.target_price):
                            alert.triggered = True
                            alert.triggered_at = now()
                            alert.save()
                        elif alert.type == "price_below" and price <= float(alert.target_price):
                            alert.triggered = True
                            alert.triggered_at = now()
                            alert.save()
