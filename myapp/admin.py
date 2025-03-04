from django.contrib import admin
from .models import ShippingAddress, Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('product_id', 'product_name', 'quantity', 'price', 'image_url')
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('user__email', 'user__first_name', 'shipping_address__full_name')
    readonly_fields = ('user', 'total_amount', 'created_at')
    inlines = [OrderItemInline]
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return True

    def delete_model(self, request, obj):
        shipping_address = obj.shipping_address
        obj.delete()
        # Delete shipping address if it's not associated with any other orders
        if shipping_address and not Order.objects.filter(shipping_address=shipping_address).exists():
            shipping_address.delete()

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            self.delete_model(request, obj)

@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'city', 'state', 'created_at')
    list_filter = ('created_at', 'state', 'city')
    search_fields = ('full_name', 'email', 'phone', 'address')
    readonly_fields = ('user', 'created_at')

    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return True
