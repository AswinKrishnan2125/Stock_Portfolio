from django.contrib import admin
from .models import Portfolio, Stock


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'company_name', 'portfolio', 'shares', 'purchase_price', 'current_price', 'total_value', 'gain_loss_percentage')
    list_filter = ('portfolio', 'purchase_date', 'created_at')
    search_fields = ('symbol', 'company_name', 'portfolio__name')
    readonly_fields = ('total_value', 'gain_loss', 'gain_loss_percentage', 'created_at', 'updated_at')
    
    def total_value(self, obj):
        return f"${obj.total_value:,.2f}"
    total_value.short_description = 'Total Value'
    
    def gain_loss_percentage(self, obj):
        return f"{obj.gain_loss_percentage:.2f}%"
    gain_loss_percentage.short_description = 'Gain/Loss %'
