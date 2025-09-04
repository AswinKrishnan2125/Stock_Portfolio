import json
import requests
from datetime import datetime
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.cache import cache
import asyncio


class StockPriceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.symbols = ['AAPL', 'GOOGL']
        self.running = True
        asyncio.create_task(self.send_prices())

    async def disconnect(self, close_code):
        self.running = False

    @sync_to_async
    def fetch_prices(self):
        cached_data = cache.get("stock_prices")
        if cached_data:
            return {
                'prices': cached_data,
                'last_updated': datetime.now().isoformat(),
                'cached': True
            }

        prices = []
        for symbol in self.symbols:
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
        return {
            'prices': prices,
            'last_updated': datetime.now().isoformat(),
            'cached': False
        }

    async def send_prices(self):
        while self.running:
            data = await self.fetch_prices()
            await self.send(text_data=json.dumps(data))
            await asyncio.sleep(60)  # update every 10 sec
