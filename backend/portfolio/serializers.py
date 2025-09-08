from rest_framework import serializers
from .models import Portfolio, Stock, InterestedStock


class StockSerializer(serializers.ModelSerializer):
    total_value = serializers.ReadOnlyField()
    gain_loss = serializers.ReadOnlyField()
    gain_loss_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Stock
        fields = [
            'id', 'symbol', 'company_name', 'shares', 'purchase_price',
            'purchase_date', 'current_price', 'notes', 'total_value',
            'gain_loss', 'gain_loss_percentage', 'created_at', 'updated_at'
        ]


class PortfolioSerializer(serializers.ModelSerializer):
    stocks = StockSerializer(many=True, read_only=True)
    total_value = serializers.SerializerMethodField()
    total_gain_loss = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'description', 'stocks', 'total_value',
            'total_gain_loss', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']

    def get_total_value(self, obj):
        return sum(stock.total_value for stock in obj.stocks.all())

    def get_total_gain_loss(self, obj):
        return sum(stock.gain_loss for stock in obj.stocks.all())

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PortfolioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = ['name', 'description']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class StockCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = [
            'symbol', 'company_name', 'shares', 'purchase_price',
            'purchase_date', 'current_price', 'notes'
        ]

    def create(self, validated_data):
        portfolio_id = self.context['portfolio_id']
        validated_data['portfolio_id'] = portfolio_id
        return super().create(validated_data)


class InterestedStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterestedStock
        fields = ['id', 'symbol', 'name', 'added_at']
