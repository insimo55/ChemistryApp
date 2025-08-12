# backend/api/views.py
from django.db import transaction as db_transaction
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .filters import TransactionFilter
from .models import Chemical, Facility, Inventory, Transaction, User
from .permissions import IsAdminOrLogisticianForWrite, IsAdminUser
from .serializers import (ChemicalSerializer, FacilitySerializer,
                          InventorySerializer, TransactionSerializer, UserSerializer)
from .services import recalculate_inventory_for_items
from .helpers import validate_and_create_operation
from django.db.models import Sum, Q


# Важно! Пока мы не настроили права доступа,
# разрешим доступ всем аутентифицированным пользователям.
# Позже мы это изменим на ролевую модель.
class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    permission_classes = [IsAdminOrLogisticianForWrite]
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Проверяем, есть ли на объекте остатки с ненулевым количеством
        if instance.inventory.filter(quantity__gt=0).exists():
            return Response(
                {'error': 'Нельзя удалить объект, на котором есть ненулевые остатки реагентов.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Если остатков нет, вызываем стандартный метод удаления
        return super().destroy(request, *args, **kwargs)

class ChemicalViewSet(viewsets.ModelViewSet):
    queryset = Chemical.objects.all()
    serializer_class = ChemicalSerializer
    permission_classes = [IsAdminOrLogisticianForWrite]

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Только для чтения. Остатки изменяются через транзакции.
    """
    queryset = Inventory.objects.all().order_by('facility__name')
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    # Добавим возможность фильтрации по объекту
    filterset_fields = ['facility']


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Только для чтения. Новые транзакции будут создаваться через отдельный эндпоинт.
    """
    filterset_class = TransactionFilter
    queryset = Transaction.objects.all().order_by('-timestamp')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Добавим фильтры для удобства
    filterset_fields = ['transaction_type', 'chemical', 'from_facility', 'to_facility', 'performed_by']

class UserViewSet(viewsets.ModelViewSet):
    """
    Только для чтения и только для админов (пока для всех аутентифицированных).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]



class InventoryReportAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # 1. Получаем и валидируем параметры
        facility_id = request.query_params.get('facility_id')
        chemical_id = request.query_params.get('chemical_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not all([facility_id, chemical_id, start_date, end_date]):
            raise ValidationError("Необходимо указать facility_id, chemical_id, start_date и end_date.")

        # 2. Расчет начального остатка (все операции ДО start_date)
        opening_balance_income = Transaction.objects.filter(
            to_facility_id=facility_id, chemical_id=chemical_id, operation_date__lt=start_date
        ).aggregate(total=Sum('quantity'))['total'] or Decimal(0)
        
        opening_balance_outcome = Transaction.objects.filter(
            from_facility_id=facility_id, chemical_id=chemical_id, operation_date__lt=start_date
        ).aggregate(total=Sum('quantity'))['total'] or Decimal(0)

        opening_balance = opening_balance_income - opening_balance_outcome

        # 3. Расчет прихода и расхода ЗА ПЕРИОД
        period_income = Transaction.objects.filter(
            to_facility_id=facility_id, chemical_id=chemical_id, operation_date__range=[start_date, end_date]
        ).aggregate(total=Sum('quantity'))['total'] or Decimal(0)

        period_outcome = Transaction.objects.filter(
            from_facility_id=facility_id, chemical_id=chemical_id, operation_date__range=[start_date, end_date]
        ).aggregate(total=Sum('quantity'))['total'] or Decimal(0)

        # 4. Расчет конечного остатка
        closing_balance = opening_balance + period_income - period_outcome
        
        report_data = {
            'opening_balance': opening_balance,
            'total_income': period_income,
            'total_outcome': period_outcome,
            'closing_balance': closing_balance,
        }
        return Response(report_data, status=status.HTTP_200_OK)

    


class BulkOperationAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        try:
            with db_transaction.atomic():
                created_transactions = validate_and_create_operation(request, request.data)
                recalculate_inventory_for_items(created_transactions)
        except (ValidationError, Facility.DoesNotExist, Chemical.DoesNotExist) as e:
            error_detail = getattr(e, 'detail', str(e))
            return Response({'error': error_detail}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = TransactionSerializer(created_transactions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class EditOperationAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        original_uuid = request.data.get('original_uuid')
        new_data = request.data.get('new_operation_data')

        if not original_uuid or not new_data:
            return Response({'error': 'original_uuid и new_operation_data обязательны.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            original_transactions = list(Transaction.objects.filter(operation_uuid=original_uuid))
            if not original_transactions:
                return Response({'error': 'Операция не найдена'}, status=status.HTTP_404_NOT_FOUND)
            
            Transaction.objects.filter(operation_uuid=original_uuid).delete()
            
            created_transactions = []
            if new_data.get('items', []):
                try:
                    created_transactions = validate_and_create_operation(request, new_data)
                except (ValidationError, Facility.DoesNotExist, Chemical.DoesNotExist) as e:
                    raise # Перебрасываем ошибку, чтобы откатить транзакцию БД
            
            all_affected = original_transactions + created_transactions
            recalculate_inventory_for_items(all_affected)

        return Response({'status': 'Операция успешно изменена'}, status=status.HTTP_200_OK)

class DeleteOperationAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        operation_uuid = request.data.get('operation_uuid')
        if not operation_uuid:
            return Response({'error': 'operation_uuid is required'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            transactions_to_delete = list(Transaction.objects.filter(operation_uuid=operation_uuid))
            if not transactions_to_delete:
                return Response({'error': 'Операция не найдена'}, status=status.HTTP_404_NOT_FOUND)
            
            Transaction.objects.filter(operation_uuid=operation_uuid).delete()
            recalculate_inventory_for_items(transactions_to_delete)
            
        return Response(status=status.HTTP_204_NO_CONTENT)

