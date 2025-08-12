# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FacilityViewSet, ChemicalViewSet, InventoryViewSet,
    TransactionViewSet, UserViewSet, BulkOperationAPIView, EditOperationAPIView, DeleteOperationAPIView, InventoryReportAPIView
)

# Создаем роутер
router = DefaultRouter()

# Регистрируем наши ViewSet'ы. DRF сам создаст все нужные URL.
# /api/facilities/, /api/facilities/{id}/ и т.д.
router.register(r'facilities', FacilityViewSet, basename='facility')
router.register(r'chemicals', ChemicalViewSet, basename='chemical')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'users', UserViewSet, basename='user')

# Основные URL нашего приложения
urlpatterns = [
    path('', include(router.urls)),

    # path('transactions/create/', TransactionCreateAPIView.as_view(), name='transaction-create'),

    # path('transactions/create/bulk/', BulkTransactionCreateAPIView.as_view(), name='bulk-transaction-create'),
    path('operations/create/bulk/', BulkOperationAPIView.as_view(), name='bulk-operation-create'),
    path('operations/delete/', DeleteOperationAPIView.as_view(), name='delete-operation'),
    path('operations/edit/', EditOperationAPIView.as_view(), name='edit-operation'),
    path('reports/inventory-period/', InventoryReportAPIView.as_view(), name='inventory-report'),
    # Новый URL для создания транзакций
]