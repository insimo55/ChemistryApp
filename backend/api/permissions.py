# backend/api/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """
    Разрешение только для пользователей с ролью 'admin'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsLogisticianUser(BasePermission):
    """
    Разрешение только для пользователей с ролью 'logistician'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'logistician'

class IsEngineerUser(BasePermission):
    """
    Разрешение только для пользователей с ролью 'engineer'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'engineer'
        
class IsAdminOrLogistician(BasePermission):
    """
    Разрешение для админов или логистов.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.role == 'logistician')
    

class IsAdminOrLogisticianForWrite(BasePermission):
    """
    Разрешает чтение всем аутентифицированным пользователям,
    а запись - только админам и логистам.
    """
    def has_permission(self, request, view):
        # Если это безопасный метод (GET, HEAD, OPTIONS), разрешаем доступ всем, кто залогинен
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Для всех остальных методов (POST, PUT, DELETE) проверяем роль
        return request.user and request.user.is_authenticated and (request.user.role in ['admin', 'logistician'])