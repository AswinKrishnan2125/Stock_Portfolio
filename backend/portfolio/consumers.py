


import json
import asyncio
import websockets
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.core.cache import cache  # use Django cache


class LivePriceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.symbols = ["AAPL", "GOOGL","MSFT", "AMZN", "TSLA"]
        self.running = True
        self.prev_prices = {}
        asyncio.create_task(self.stream_prices())

    async def disconnect(self, close_code):
        self.running = False

    async def stream_prices(self):
        finnhub_url = f"wss://ws.finnhub.io?token={settings.FINNHUB_API_KEY}"

        try:
            async with websockets.connect(finnhub_url) as ws:
                # Subscribe to symbols
                for sym in self.symbols:
                    await ws.send(json.dumps({"type": "subscribe", "symbol": sym}))
                    print(await ws.recv())  # confirm subscription

                while self.running:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=5)
                        data = json.loads(msg)

                        if "data" in data and data["type"] == "trade":
                            for trade in data["data"]:
                                sym = trade["s"]
                                price = float(trade["p"])
                                ts = trade["t"]

                                prev_price = self.prev_prices.get(sym, price)
                                change = price - prev_price
                                change_percent = (change / prev_price * 100) if prev_price != 0 else 0

                                # update memory cache
                                self.prev_prices[sym] = price

                                update = {
                                    "symbol": sym,
                                    "latestPrice": price,
                                    "change": change,
                                    "changePercent": change_percent,
                                    "timestamp": ts,
                                }

                                # store in Redis via Django cache
                                cache.set(f"price:{sym}", update, timeout=86400)

                            # build updates from cache
                            updates = []
                            for sym in self.symbols:
                                cached = cache.get(f"price:{sym}")
                                if cached:
                                    updates.append(cached)

                            await self.send(text_data=json.dumps({"prices": updates}))

                    except asyncio.TimeoutError:
                        # no live data → serve cached
                        updates = []
                        for sym in self.symbols:
                            cached = cache.get(f"price:{sym}")
                            if cached:
                                updates.append(cached)
                        if updates:
                            await self.send(text_data=json.dumps({"prices": updates}))

                    except Exception as e:
                        await self.send(text_data=json.dumps({"error": str(e)}))
                        break

        except Exception as e:
            await self.send(text_data=json.dumps({"error": f"WebSocket error: {str(e)}"}))
