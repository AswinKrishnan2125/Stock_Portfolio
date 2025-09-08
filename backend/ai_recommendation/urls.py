from django.urls import path
from . import views

urlpatterns = [
    path("", views.RecommendationView, name="recommendations"),  # /api/recommendations/
]