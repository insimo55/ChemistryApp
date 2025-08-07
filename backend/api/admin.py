# backend/api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Facility, Chemical, Inventory, Transaction

# Расширяем стандартный админ-класс для User, чтобы показать наши кастомные поля
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Добавляем 'role' и 'related_facility' в список отображаемых полей
    list_display = ('username', 'email', 'role', 'related_facility', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    # Добавляем наши поля в форму редактирования пользователя
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительные поля', {'fields': ('role', 'related_facility')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Дополнительные поля', {'fields': ('role', 'related_facility')}),
    )

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'location', 'created_at')
    list_filter = ('type',)
    search_fields = ('name', 'location')

@admin.register(Chemical)
class ChemicalAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit_of_measurement')
    search_fields = ('name',)

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('facility', 'chemical', 'quantity')
    list_filter = ('facility',)
    search_fields = ('chemical__name', 'facility__name')
    # autocomplete_fields делает поиск по ForeignKey очень удобным
    autocomplete_fields = ['facility', 'chemical']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'get_transaction_type_display', 'chemical', 'quantity', 'from_facility', 'to_facility', 'performed_by')
    list_filter = ('transaction_type', 'timestamp', 'from_facility', 'to_facility')
    search_fields = ('chemical__name', 'performed_by__username')
    # Запрещаем редактировать время создания, оно должно ставиться автоматически
    readonly_fields = ('timestamp',)

    # Улучшаем отображение поля transaction_type
    def get_transaction_type_display(self, obj):
        return obj.get_transaction_type_display()
    get_transaction_type_display.short_description = 'Тип транзакции'