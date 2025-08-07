import json
import uuid
from decimal import Decimal, InvalidOperation
from rest_framework.exceptions import ValidationError
from .models import Chemical, Facility, Transaction


def validate_and_create_operation(request, new_data):
    """
    Хелпер, который валидирует данные для новой операции и создает транзакции.
    Возвращает список созданных транзакций.
    """
    # 1. Валидация общих данных
    transaction_type = new_data.get('transaction_type')
    from_facility_id = new_data.get('from_facility')
    to_facility_id = new_data.get('to_facility')
    comment = new_data.get('comment', '')
    document_file = new_data.get('document_file') # FormData передаст файл, JSON - нет
    operation_date = new_data.get('operation_date')

    if from_facility_id in ['null', '']: from_facility_id = None
    if to_facility_id in ['null', '']: to_facility_id = None
    if not operation_date: raise ValidationError("Дата операции (operation_date) обязательна.")

    from_facility = Facility.objects.get(pk=from_facility_id) if from_facility_id else None
    to_facility = Facility.objects.get(pk=to_facility_id) if to_facility_id else None

    if from_facility_id in ['null', '']: from_facility_id = None
    if to_facility_id in ['null', '']: to_facility_id = None

    if transaction_type == 'add' and not to_facility:
        raise ValidationError("Для 'Поступления' необходимо указать объект назначения (to_facility).")
    if transaction_type == 'consume' and not from_facility:
        raise ValidationError("Для 'Списания' необходимо указать объект-источник (from_facility).")
    if transaction_type == 'transfer' and (not from_facility or not to_facility):
        raise ValidationError("Для 'Перемещения' необходимо указать оба объекта.")
    if not operation_date:
        raise ValidationError("Дата операции (operation_date) обязательна.")
    if request.user.role == 'engineer':
        if transaction_type in ['add', 'transfer']:
            raise ValidationError("Инженер может выполнять только операции списания.")
        if from_facility and from_facility.id != request.user.related_facility_id:
            raise ValidationError("Инженер может списывать реагенты только со своего объекта.")

    # 2. Валидация массива реагентов
    items = new_data.get('items', [])
    if isinstance(items, str): # Если пришел JSON-строкой из FormData
        items = json.loads(items)
    if not isinstance(items, list) or not items: 
        raise ValidationError('Поле "items" должно быть непустым массивом.')
    
    transactions_data = []
    for item in items:
        chemical_id = item.get('chemicalId')
        quantity_str = str(item.get('quantity')) # Приводим к строке для Decimal
        try:
            quantity_decimal = Decimal(quantity_str)
            if quantity_decimal <= 0: raise ValueError
        except (InvalidOperation, ValueError):
            raise ValidationError(f'Количество "{quantity_str}" должно быть положительным числом.')
        transactions_data.append({'chemical_id': chemical_id, 'quantity': quantity_decimal})

    # 3. Создание транзакций
    created_transactions = []
    operation_id = uuid.uuid4()
    for data in transactions_data:
        tx = Transaction.objects.create(
            operation_uuid=operation_id,
            transaction_type=transaction_type,
            from_facility=from_facility,
            to_facility=to_facility,
            comment=comment,
            document_file=new_data.get('document_file'), # Берем напрямую из new_data
            operation_date=operation_date,
            performed_by=request.user,
            **data
        )
        created_transactions.append(tx)
    
    return created_transactions