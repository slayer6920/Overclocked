from django.urls import path
from . import views

urlpatterns = [  # Default/root URL shows login page
    path('', views.home, name='home'),
    path('parts/', views.parts, name='parts'),
    path('reviews/', views.reviews, name='reviews'),
    path('about/', views.about, name='about'),
    path('cart/', views.cart, name='cart'),
    path('signin/', views.signin, name='signin'),
    path('orderconf/', views.orderconf, name='orderconf'),
    path('signup/', views.signup, name='signup'),
    path('profile/', views.profile, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.orders, name='orders'),
    path('delete-order/<int:order_id>/', views.delete_order, name='delete_order'),
]