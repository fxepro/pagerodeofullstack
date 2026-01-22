from django.urls import path
from . import views

urlpatterns = [
    # Public deal endpoints
    path('api/deals/active/', views.list_active_deals, name='list_active_deals'),
    path('api/deals/featured/', views.get_featured_deal, name='get_featured_deal'),
    path('api/deals/<slug:slug>/', views.get_deal_by_slug, name='get_deal_by_slug'),
    
    # Deal subscription endpoints
    path('api/payments/paypal/create-deal-subscription/', views.create_deal_subscription, name='create_deal_subscription'),
    path('api/payments/paypal/confirm-deal/', views.confirm_deal_subscription, name='confirm_deal_subscription'),
    
    # Admin deal management endpoints (specific routes first)
    path('api/admin/deals/create/', views.create_deal, name='create_deal'),
    path('api/admin/deals/plans/', views.get_subscription_plans, name='get_subscription_plans'),
    path('api/admin/deals/<int:deal_id>/update/', views.update_deal, name='update_deal'),
    path('api/admin/deals/<int:deal_id>/delete/', views.delete_deal, name='delete_deal'),
    path('api/admin/deals/<int:deal_id>/', views.get_deal, name='get_deal'),
    path('api/admin/deals/', views.list_all_deals, name='list_all_deals'),
]

