# alerts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.alerts_list_create, name="alerts_list_create"),  # /api/alerts/
    path("<int:pk>/", views.alert_detail, name="alert_detail"),     # /api/alerts/<pk>/
    path("check/", views.check_alerts, name="check_alerts"),        # /api/alerts/check/
    path("<int:pk>/trigger/", views.trigger_alert, name="trigger_alert"),  # /api/alerts/<pk>/trigger/
]
