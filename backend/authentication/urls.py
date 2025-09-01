from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, login_view, user_profile

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('profile/', user_profile, name='profile'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
