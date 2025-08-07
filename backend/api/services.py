# backend/api/services.py
from django.db import transaction as db_transaction
from django.db.models import Q
from .models import Inventory, Transaction

@db_transaction.atomic
def recalculate_inventory_for_items(items):
    """
    Принимает список объектов транзакций (старых или новых) и запускает
    пересчет для всех уникальных пар (объект, реагент), которые были затронуты.
    """
    pairs_to_recalculate = set()
    for tx in items:
        # Собираем уникальные пары (Facility, Chemical)
        if tx.from_facility:
            pairs_to_recalculate.add((tx.from_facility, tx.chemical))
        if tx.to_facility:
            pairs_to_recalculate.add((tx.to_facility, tx.chemical))

    # Для каждой уникальной пары запускаем полный пересчет истории
    for facility, chemical in pairs_to_recalculate:
        recalculate_single_inventory(facility, chemical)

def recalculate_single_inventory(facility, chemical):
    """
    Пересчитывает всю историю для ОДНОГО реагента на ОДНОМ объекте
    и обновляет итоговое значение в модели Inventory.
    Разрешает отрицательные остатки.
    """
    # 1. Получаем ВСЕ транзакции для данной пары, отсортированные хронологически
    related_transactions = Transaction.objects.filter(
        (Q(from_facility=facility) | Q(to_facility=facility)) &
        Q(chemical=chemical)
    ).order_by('operation_date', 'timestamp')

    # 2. Считаем баланс с нуля
    running_balance = 0
    for tx in related_transactions:
        if tx.to_facility == facility:  # Поступление на наш объект
            running_balance += tx.quantity
        elif tx.from_facility == facility:  # Списание с нашего объекта
            running_balance -= tx.quantity
            
    # 3. Обновляем (или создаем) запись в таблице остатков
    inventory_item, created = Inventory.objects.update_or_create(
        facility=facility,
        chemical=chemical,
        defaults={'quantity': running_balance}
    )