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
from .utils import price_stream


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
from asgiref.sync import async_to_sync
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_alerts(request):
    """Check only current user's alerts"""
    # Run the async price_stream for the user
    async_to_sync(price_stream)(user=request.user)
    # Return all triggered alerts for the user
    triggered = Alert.objects.filter(user=request.user, triggered=True)
    serializer = AlertSerializer(triggered, many=True)
    return Response({"triggered": serializer.data})
