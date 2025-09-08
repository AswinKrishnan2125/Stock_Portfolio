"""
URL configuration for stocktracker project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('portfolio.urls')),
    path('api/mock/', include('portfolio.mock_urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/recommendation', include('portfolio.mock_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
