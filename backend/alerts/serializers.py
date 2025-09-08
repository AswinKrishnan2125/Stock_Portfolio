# # alerts/serializers.py
# from rest_framework import serializers
# from .models import Alert

# class AlertSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Alert
#         fields = "__all__"


from rest_framework import serializers
from .models import Alert

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ["id", "user", "symbol", "type", "target_price", "enabled", "triggered", "created_at", "triggered_at"]
        read_only_fields = ["id", "created_at", "user", "triggered", "triggered_at"]
