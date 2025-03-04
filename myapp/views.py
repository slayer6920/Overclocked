from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Prefetch
from .models import ShippingAddress, Order, OrderItem
import json

@login_required
def orders(request):
    # Get all orders for the current user with related data
    orders = Order.objects.filter(user=request.user).select_related('shipping_address').prefetch_related(
        'items'  # Use 'items' instead of 'orderitem_set' because that's the related_name in the model
    ).order_by('-created_at')
    
    # Convert orders to a format suitable for the template
    orders_data = []
    for order in orders:
        order_data = {
            'id': order.id,
            'created_at': order.created_at,
            'total_amount': order.total_amount,
            'shipping_address': {
                'name': order.shipping_address.full_name,
                'email': order.shipping_address.email,
                'phone': order.shipping_address.phone,
                'address': order.shipping_address.address,
                'city': order.shipping_address.city,
                'state': order.shipping_address.state,
                'pincode': order.shipping_address.pincode
            },
            'items': []
        }
        
        # Add order items
        for item in order.items.all():
            order_data['items'].append({
                'id': item.product_id,
                'name': item.product_name,
                'quantity': item.quantity,
                'price': item.price,
                'image_url': item.image_url
            })
        
        orders_data.append(order_data)
    
    return render(request, 'orders.html', {'orders': orders_data})

@login_required
def home(request):
    return render(request, 'home.html')

@login_required
def parts(request):
    return render(request, 'parts.html')

@login_required
def reviews(request):
    return render(request, 'reviews.html')

@login_required
def about(request):
    return render(request, 'about.html')

@login_required
def cart(request):
    return render(request, 'cart.html')

@login_required
def orderconf(request):
    # Get the latest order for the current user
    try:
        order = Order.objects.filter(user=request.user).latest('created_at')
        context = {
            'order': {
                'id': order.id,
                'total_amount': order.total_amount,
                'created_at': order.created_at,
                'shipping_address': {
                    'name': order.shipping_address.full_name,
                    'address': order.shipping_address.address,
                    'city': order.shipping_address.city,
                    'state': order.shipping_address.state,
                    'pincode': order.shipping_address.pincode
                }
            }
        }
    except Order.DoesNotExist:
        context = {'order': None}
    
    return render(request, 'orderconf.html', context)

@login_required
def profile(request):
    return render(request, 'profile.html')

def logout_view(request):
    logout(request)
    return redirect('home')

@ensure_csrf_cookie
def signup(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already exists'})
        
        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = name
        user.save()
        
        login(request, user)
        return redirect('home')
    
    return render(request, 'signup.html')

@ensure_csrf_cookie
def signin(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            return render(request, 'signin.html', {'error': 'Invalid email or password'})
    
    return render(request, 'signin.html')

@login_required
def checkout(request):
    if request.method == 'POST':
        try:
            # Parse the JSON data from the request
            data = json.loads(request.body)
            
            # Create shipping address
            shipping_address = ShippingAddress.objects.create(
                user=request.user,
                full_name=data['name'],
                email=data['email'],
                phone=data['phone'],
                address=data['address'],
                city=data['city'],
                state=data['state'],
                pincode=data['pincode']
            )
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                shipping_address=shipping_address,
                total_amount=float(data['cart_total'])
            )
            
            # Create order items
            for item in data['cart_items']:
                OrderItem.objects.create(
                    order=order,
                    product_id=item['id'],
                    product_name=item['name'],
                    quantity=item['quantity'],
                    price=float(item['price']),
                    image_url=item.get('image_url', '/static/Image/default.jpg')
                )
            
            return JsonResponse({
                'success': True,
                'order_id': order.id,
                'redirect_url': '/orderconf/'
            })
            
        except Exception as e:
            print("Error processing checkout:", str(e))  # Debug log
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return render(request, 'checkout.html')

@login_required
def delete_order(request, order_id):
    try:
        # Get the order and verify it belongs to the current user
        order = Order.objects.get(id=order_id, user=request.user)
        order.delete()
        return JsonResponse({'success': True})
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)
