# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include # <--- Убедитесь, что include импортирован
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
      # Эндпоинты аутентификации
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    
    # ВАЖНАЯ СТРОКА: все, что начинается с 'api/', ищем в файле 'api.urls'
    path('api/', include('api.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)