# # # import json
# # # import requests
# # # from datetime import datetime
# # # from django.conf import settings
# # # from channels.generic.websocket import AsyncWebsocketConsumer
# # # from asgiref.sync import sync_to_async
# # # from django.core.cache import cache
# # # import asyncio


# # # class StockPriceConsumer(AsyncWebsocketConsumer):
# # #     async def connect(self):
# # #         await self.accept()
# # #         self.symbols = ['AAPL', 'GOOGL']
# # #         self.running = True
# # #         asyncio.create_task(self.send_prices())

# # #     async def disconnect(self, close_code):
# # #         self.running = False

# # #     @sync_to_async
# # #     def fetch_prices(self):
# # #         cached_data = cache.get("stock_prices")
# # #         if cached_data:
# # #             return {
# # #                 'prices': cached_data,
# # #                 'last_updated': datetime.now().isoformat(),
# # #                 'cached': True
# # #             }

# # #         prices = []
# # #         for symbol in self.symbols:
# # #             url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={settings.ALPHAVANTAGE_API_KEY}"
# # #             response = requests.get(url)
# # #             data = response.json()

# # #             if "Global Quote" in data and data["Global Quote"]:
# # #                 quote = data["Global Quote"]

# # #                 prices.append({
# # #                     'symbol': symbol,
# # #                     'current_price': float(quote["05. price"]),
# # #                     'change': float(quote["09. change"]),
# # #                     'change_percent': quote["10. change percent"],
# # #                     'volume': int(quote["06. volume"]),
# # #                     'timestamp': datetime.now().isoformat()
# # #                 })
# # #             else:
# # #                 prices.append({
# # #                     'symbol': symbol,
# # #                     'error': 'Data not available'
# # #                 })

# # #         cache.set("stock_prices", prices, timeout=60)
# # #         return {
# # #             'prices': prices,
# # #             'last_updated': datetime.now().isoformat(),
# # #             'cached': False
# # #         }

# # #     async def send_prices(self):
# # #         while self.running:
# # #             data = await self.fetch_prices()
# # #             await self.send(text_data=json.dumps(data))
# # #             await asyncio.sleep(60)  # update every 10 sec



# # # consumers.py
# # from channels.generic.websocket import AsyncWebsocketConsumer
# # import json
# # import yfinance as yf
# # import asyncio
# # import redis

# # r = redis.Redis(host="localhost", port=6379, db=0)

# # class LivePriceConsumer(AsyncWebsocketConsumer):
# #     async def connect(self):
# #         await self.accept()
# #         asyncio.create_task(self.send_prices())

# #     async def send_prices(self):
# #         symbols = ["AAPL", "GOOGL"]
# #         while True:
# #             updates = []
# #             for sym in symbols:
# #                 ticker = yf.Ticker(sym)
# #                 price = ticker.history(period="1d", interval="1m").tail(1)["Close"].iloc[0]

# #                 # Cast to Python float immediately
# #                 price = float(price)

# #                 # Get previous price from redis
# #                 prev_price = r.get(f"prev:{sym}")
# #                 if prev_price is not None:
# #                     prev_price = float(prev_price.decode())  # Redis gives bytes
# #                 else:
# #                     prev_price = price

# #                 change = price - prev_price
# #                 change_percent = (change / prev_price * 100) if prev_price != 0 else 0

# #                 # Save current price for next tick (as plain float string)
# #                 r.set(f"prev:{sym}", str(price))

# #                 updates.append({
# #                     "symbol": sym,
# #                     "latestPrice": price,
# #                     "change": change,
# #                     "changePercent": change_percent
# #                 })

# #             await self.send(text_data=json.dumps({"prices": updates}))
# #             await asyncio.sleep(30)  # fetch every 30s



# import json
# import asyncio
# import websockets
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.conf import settings


# class LivePriceConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         await self.accept()
#         self.symbols = ["BINANCE:BTCUSDT"]
#         self.running = True
#         self.prev_prices = {}  # store previous prices in memory
#         self.ws = None
#         asyncio.create_task(self.stream_prices())

#     async def disconnect(self, close_code):
#         self.running = False
        

#     async def stream_prices(self):
#         finnhub_url = f"wss://ws.finnhub.io?token={settings.FINNHUB_API_KEY}"

#         try:
#             async with websockets.connect(finnhub_url) as ws:
#                 self.ws = ws 
#                 # Subscribe to symbols
#                 for sym in self.symbols:
#                     await ws.send(json.dumps({"type": "subscribe", "symbol": sym}))
#                     print(await ws.recv())  # Confirm subscription

#                 while self.running:
#                     try:
#                         msg = await asyncio.wait_for(ws.recv(), timeout=5)
#                         data = json.loads(msg)

#                         # Finnhub sends: {"data":[{"p":price,"s":symbol,"t":timestamp}], "type":"trade"}
#                         # if "data" in data and data["type"] == "trade":
#                         #     updates = []
#                         #     for trade in data["data"]:
#                         #         sym = trade["s"]
#                         #         price = float(trade["p"])
#                         #         ts = trade["t"]

#                         #         # Get previous price
#                         #         prev_price = self.prev_prices.get(sym, price)

#                         #         # Calculate change and percent
#                         #         change = price - prev_price
#                         #         change_percent = (change / prev_price * 100) if prev_price != 0 else 0

#                         #         # Save current price for next calculation
#                         #         self.prev_prices[sym] = price

#                         #         updates.append({
#                         #             "symbol": sym,
#                         #             "latestPrice": price,
#                         #             "change": change,
#                         #             "changePercent": change_percent,
#                         #             "timestamp": ts
#                         #         })

#                         #     # Send to frontend
#                         #     await self.send(text_data=json.dumps({"prices": updates}))
#                         if "data" in data and data["type"] == "trade":
#                             for trade in data["data"]:
#                                 sym = trade["s"]
#                                 price = float(trade["p"])
#                                 ts = trade["t"]

#                                 prev_price = self.prev_prices.get(sym, price)
#                                 change = price - prev_price
#                                 change_percent = (change / prev_price * 100) if prev_price != 0 else 0

#                                 # update cache
#                                 self.prev_prices[sym] = price

#                                 # store full snapshot
#                                 self.prev_prices[f"{sym}_change"] = change
#                                 self.prev_prices[f"{sym}_changePercent"] = change_percent
#                                 self.prev_prices[f"{sym}_timestamp"] = ts

#                             # build a complete update for all symbols
#                             updates = []
#                             for sym in self.symbols:
#                                 if sym in self.prev_prices:
#                                     updates.append({
#                                         "symbol": sym,
#                                         "latestPrice": self.prev_prices[sym],
#                                         "change": self.prev_prices.get(f"{sym}_change", 0),
#                                         "changePercent": self.prev_prices.get(f"{sym}_changePercent", 0),
#                                         "timestamp": self.prev_prices.get(f"{sym}_timestamp", 0),
#                                     })

#                             await self.send(text_data=json.dumps({"prices": updates}))


#                     except Exception as e:
#                         await self.send(text_data=json.dumps({"error": str(e)}))
#                         break

#         except Exception as e:
#             await self.send(text_data=json.dumps({"error": f"WebSocket error: {str(e)}"}))






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
