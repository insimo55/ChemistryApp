# backend/api/filters.py
from django_filters import rest_framework as filters
from .models import Transaction, Facility
from django.db.models import Q

class TransactionFilter(filters.FilterSet):
    start_date = filters.DateTimeFilter(field_name="operation_date", lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name="operation_date", lookup_expr='lte')
    facility = filters.ModelChoiceFilter(queryset=Facility.objects.all(), method='filter_by_facility')

    # Новый кастомный фильтр для поиска по любому объекту
    facility = filters.ModelChoiceFilter(
        queryset=Facility.objects.all(),
        method='filter_by_facility'
    )

    class Meta:
        model = Transaction
        fields = ['chemical', 'transaction_type', 'start_date', 'end_date', 'facility', 'operation_uuid']

    def filter_by_facility(self, queryset, name, value):
        # Ищем совпадение либо в from_facility, либо в to_facility
        return queryset.filter(Q(from_facility=value) | Q(to_facility=value))