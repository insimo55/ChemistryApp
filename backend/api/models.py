# backend/api/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone

# --- Модель пользователя ---
# Мы наследуемся от стандартного пользователя Django (AbstractUser),
# чтобы получить все поля для аутентификации (логин, пароль, email и т.д.)
# и добавляем свои поля role и related_facility.
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Администратор'
        ENGINEER = 'engineer', 'Инженер'
        LOGISTICIAN = 'logistician', 'Логист'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ENGINEER,
        verbose_name="Роль"
    )
    # related_facility - это связь "один ко многим" с моделью Facility.
    # ForeignKey означает, что один Facility может быть у многих User'ов.
    # on_delete=models.SET_NULL: если объект (Facility) удалят,
    # то у пользователя это поле просто станет пустым (NULL), а не удалит пользователя.
    # null=True, blank=True: поле может быть пустым (в базе и в формах).
    related_facility = models.ForeignKey(
        'Facility',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Закрепленный объект",
        help_text="Обязательно для инженеров"
    )

# --- Модель Объекта (склад, скважина) ---
class Facility(models.Model):
    class FacilityType(models.TextChoices):
        WAREHOUSE = 'warehouse', 'Склад'
        WELL = 'well', 'Скважина'
        OTHER = 'other', 'Прочее'

    name = models.CharField(max_length=255, verbose_name="Название объекта")
    type = models.CharField(max_length=20, choices=FacilityType.choices, verbose_name="Тип объекта")
    location = models.CharField(max_length=255, blank=True, verbose_name="Местоположение")
    # auto_now_add=True: дата и время будут установлены автоматически при создании записи.
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Объект"
        verbose_name_plural = "Объекты" # Название во множественном числе для админки

    def __str__(self):
        # Это "человекочитаемое" представление объекта. Будет видно в админке.
        return self.name

# --- Модель Реагента (справочник) ---
class Chemical(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Название реагента")
    unit_of_measurement = models.CharField(max_length=50, verbose_name="Единица измерения (кг, л, шт)")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Реагент"
        verbose_name_plural = "Реагенты"

    def __str__(self):
        return self.name

# --- Модель Остатков на складе (Инвентаризация) ---
class Inventory(models.Model):
    # Эта модель связывает Объект и Реагент, указывая количество.
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='inventory', verbose_name="Объект")
    chemical = models.ForeignKey(Chemical, on_delete=models.CASCADE, related_name='inventory', verbose_name="Реагент")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Количество")

    class Meta:
        verbose_name = "Остаток на объекте"
        verbose_name_plural = "Остатки на объектах (Инвентарь)"
        # unique_together: гарантирует, что не будет двух записей с одним и тем же
        # реагентом на одном и том же объекте.
        unique_together = ('facility', 'chemical')

    def __str__(self):
        return f"{self.chemical.name} на {self.facility.name}: {self.quantity} {self.chemical.unit_of_measurement}"

# --- Модель Транзакции (журнал операций) ---
class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        ADD = 'add', 'Поступление'
        CONSUME = 'consume', 'Списание'
        TRANSFER = 'transfer', 'Перемещение'

    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices, verbose_name="Тип транзакции")
    chemical = models.ForeignKey(Chemical, on_delete=models.PROTECT, verbose_name="Реагент")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Количество")

    # Для "Списания" и "Перемещения" (откуда)
    from_facility = models.ForeignKey(Facility, related_name='transactions_from', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Из объекта")
    # Для "Поступления" и "Перемещения" (куда)
    to_facility = models.ForeignKey(Facility, related_name='transactions_to', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="В объект")

    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Выполнил")
    timestamp = models.DateTimeField(default=timezone.now, verbose_name="Время создания записи")
    operation_date = models.DateTimeField(verbose_name="Дата и время операции")
    
    document_name = models.CharField(max_length=255, blank=True, verbose_name="Название документа")
    # upload_to: файлы будут загружаться в папку media/documents/ГОД/МЕСЯЦ/ДЕНЬ/
    document_file = models.FileField(upload_to='documents/%Y/%m/%d/', blank=True, null=True, verbose_name="Файл документа")
    comment = models.TextField(blank=True, verbose_name="Комментарий")
    operation_uuid = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True, verbose_name="ID операции")
    


    class Meta:
        verbose_name = "Транзакция"
        verbose_name_plural = "Транзакции"
        ordering = ['-operation_uuid', '-timestamp']

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.chemical.name} ({self.quantity})"