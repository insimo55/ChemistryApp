# backend/api/serializers.py
from rest_framework import serializers
from .models import User, Facility, Chemical, Inventory, Transaction

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ('id', 'name', 'type', 'location', 'created_at')

class ChemicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chemical
        fields = ('id', 'name', 'unit_of_measurement', 'description')

class UserSerializer(serializers.ModelSerializer):
    related_facility_name = serializers.CharField(source='related_facility.name', read_only=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role', 'related_facility','password','related_facility_name')
        # extra_kwards = {'password': {'write_only': True}}
        read_only_fields = ('related_facility_name',)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if password is None:
            raise serializers.ValidationError("Пароль является обязательным полем при создании пользователя.")
            
        # Создаем пользователя через менеджер, который правильно хеширует пароль
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # Если пароль был передан, обновляем его
        if password:
            instance.set_password(password)
        
        # Обновляем остальные поля
        return super().update(instance, validated_data)
    
    
# Сериализатор для отображения остатков с вложенной информацией
class InventorySerializer(serializers.ModelSerializer):
    # Показываем не просто id, а полную информацию об объекте и реагенте
    facility = FacilitySerializer(read_only=True)
    chemical = ChemicalSerializer(read_only=True)

    class Meta:
        model = Inventory
        fields = ('id', 'facility', 'chemical', 'quantity')

# Сериализатор для отображения транзакций
class TransactionSerializer(serializers.ModelSerializer):
    # Показываем имена, а не ID
    chemical = ChemicalSerializer(read_only=True) 
    from_facility = serializers.StringRelatedField(read_only=True)
    to_facility = serializers.StringRelatedField(read_only=True)
    performed_by = serializers.StringRelatedField(read_only=True)
    
    from_facility_id = serializers.PrimaryKeyRelatedField(
        source='from_facility', read_only=True, allow_null=True
    )
    to_facility_id = serializers.PrimaryKeyRelatedField(
        source='to_facility', read_only=True, allow_null=True
    )
    class Meta:
        model = Transaction
        fields = (
            'id', 'timestamp', 'transaction_type', 'chemical', 'quantity',
            'from_facility', 'to_facility','from_facility_id', 'to_facility_id', 'performed_by', 'document_name',
            'document_file', 'comment', 'operation_uuid',  'operation_date'
        )


class TransactionCreateSerializer(serializers.ModelSerializer):
    chemical = serializers.PrimaryKeyRelatedField(queryset=Chemical.objects.all())
    from_facility = serializers.PrimaryKeyRelatedField(queryset=Facility.objects.all(), required=False, allow_null=True)
    to_facility = serializers.PrimaryKeyRelatedField(queryset=Facility.objects.all(), required=False, allow_null=True)
    performed_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Transaction
        fields = (
            'transaction_type', 'chemical', 'quantity', 'from_facility',
            'to_facility', 'comment', 'document_name', 'document_file', 'performed_by'
        )
    
    def validate(self, data):
        ttype = data.get('transaction_type')
        from_f = data.get('from_facility')
        to_f = data.get('to_facility')

        if ttype == 'add' and not to_f:
            raise serializers.ValidationError("Для поступления (add) необходимо указать объект 'to_facility'.")
        if ttype == 'consume' and not from_f:
            raise serializers.ValidationError("Для списания (consume) необходимо указать объект 'from_facility'.")
        if ttype == 'transfer' and (not from_f or not to_f):
            raise serializers.ValidationError("Для перемещения (transfer) необходимо указать оба объекта 'from_facility' и 'to_facility'.")
        
        # 'self.context' - это важная часть, убедитесь, что она есть
        user = self.context['request'].user
        if user.role == 'engineer':
            if ttype == 'consume' and from_f != user.related_facility:
                raise serializers.ValidationError("Инженер может списывать реагенты только со своего закрепленного объекта.")
            if ttype in ['add', 'transfer']:
                raise serializers.ValidationError("Инженер может выполнять только операции списания (consume).")

        return data