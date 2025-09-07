from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Alert
from .serializers import AlertSerializer
from .utils import price_stream

# ✅ List all alerts / Create new alert
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def alerts_list_create(request):
    if request.method == "GET":
        alerts = Alert.objects.all().order_by("-created_at")
        serializer = AlertSerializer(alerts, many=True)
        # 🔥 return a plain list (frontend expects this)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = AlertSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ✅ Retrieve / Update / Delete a single alert
@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def alert_detail(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
    except Alert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = AlertSerializer(alert)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = AlertSerializer(alert, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        alert.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([AllowAny])
def check_alerts(request):
    """Endpoint to manually trigger alert checks."""
    triggered = price_stream()
    serializer = AlertSerializer(triggered, many=True)
    return Response({"triggered": serializer.data})