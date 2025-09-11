from rest_framework import viewsets, permissions
from .models import Alert
from .serializers import AlertSerializer

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return alerts for the authenticated user
        return Alert.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Set the user to the authenticated user
        serializer.save(user=self.request.user)
#         serializer = AlertSerializer(alert, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     elif request.method == "DELETE":
#         alert.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)


# @api_view(["POST"])
# @permission_classes([AllowAny])
# def check_alerts(request):
#     """Endpoint to manually trigger alert checks."""
#     triggered = price_stream()
#     serializer = AlertSerializer(triggered, many=True)
#     return Response({"triggered": serializer.data})






from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Alert
from .serializers import AlertSerializer
from django.conf import settings
from django.core.cache import cache
import requests


# List & Create alerts
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def alerts_list_create(request):
    if request.method == "GET":
        alerts = Alert.objects.filter(user=request.user).order_by("-created_at")
        serializer = AlertSerializer(alerts, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = AlertSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # ✅ assign current user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Retrieve / Update / Delete alert
@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def alert_detail(request, pk):
    try:
        alert = Alert.objects.get(pk=pk, user=request.user)  # ✅ only user's alert
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = AlertSerializer(alert)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = AlertSerializer(alert, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)  # ensure ownership
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        alert.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



# Check alerts manually
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_alerts(request):
    """Lightweight check for user's alerts without opening a long-lived WS.

    For each active alert symbol:
    - Try Redis cache (price:{symbol}).
    - Fallback to Finnhub REST quote (c field).
    - Update alerts if triggered.
    Returns list of triggered alerts for the user.
    """
    user = request.user
    # Unique symbols for active, untriggered alerts
    symbols = (
        Alert.objects.filter(user=user, enabled=True, triggered=False)
        .values_list("symbol", flat=True)
        .distinct()
    )

    finnhub_token = getattr(settings, "FINNHUB_API_KEY", None)
    base_url = "https://finnhub.io/api/v1/quote"

    latest_prices = {}
    for sym in symbols:
        cached = cache.get(f"price:{sym}")
        price = None
        if isinstance(cached, dict):
            price = cached.get("latestPrice")
        elif isinstance(cached, (int, float)):
            price = float(cached)

        if price is None and finnhub_token:
            try:
                r = requests.get(base_url, params={"symbol": sym, "token": finnhub_token}, timeout=8)
                if r.ok:
                    j = r.json() or {}
                    c = j.get("c")
                    pc = j.get("pc")
                    price = float(c) if c is not None else None
                    if price is not None:
                        change = (price - pc) if (pc is not None) else None
                        change_percent = ((change / pc) * 100) if (change is not None and pc) else None
                        cache.set(
                            f"price:{sym}",
                            {
                                "latestPrice": price,
                                "change": change,
                                "changePercent": change_percent,
                                "timestamp": None,
                            },
                            timeout=60,
                        )
            except Exception:
                # Ignore network errors here; leave price as None
                pass
        latest_prices[sym] = price

    # Evaluate alerts
    active_alerts = list(
        Alert.objects.filter(user=user, enabled=True, triggered=False)
    )
    for alert in active_alerts:
        current_price = latest_prices.get(alert.symbol)
        if current_price is None:
            continue
        target = float(alert.target_price)
        should_trigger = (
            (alert.type == "price_above" and current_price >= target)
            or (alert.type == "price_below" and current_price <= target)
        )
        if should_trigger:
            alert.triggered = True
            from django.utils.timezone import now
            alert.triggered_at = now()
            alert.save(update_fields=["triggered", "triggered_at"])

    # Return user's triggered alerts
    triggered = Alert.objects.filter(user=user, triggered=True).order_by("-triggered_at")
    serializer = AlertSerializer(triggered, many=True)
    return Response({"triggered": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def trigger_alert(request, pk):
    """Mark a specific alert as triggered now (used for immediate triggering).

    Only allows updating the current user's alert. Sets triggered and triggered_at.
    """
    try:
        alert = Alert.objects.get(pk=pk, user=request.user)
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

    if not alert.enabled:
        return Response({"error": "Alert is disabled"}, status=status.HTTP_400_BAD_REQUEST)

    if not alert.triggered:
        from django.utils.timezone import now
        alert.triggered = True
        alert.triggered_at = now()
        alert.save(update_fields=["triggered", "triggered_at"])

    serializer = AlertSerializer(alert)
    return Response(serializer.data)
