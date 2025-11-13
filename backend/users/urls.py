from django.urls import path
from .views import (
    user_info, list_users, create_user, get_user,
    update_user, delete_user, assign_role, user_stats, register_user,
    update_own_profile, change_password, corporate_profile,
    payment_methods, payment_method_detail, user_subscriptions,
    subscription_detail, billing_history, monitored_site_list,
    monitored_site_detail
)
from .role_views import (
    list_roles, get_role, create_role, update_role, delete_role,
    list_permissions, get_role_permissions, update_role_permissions
)
from .sitemap_views import generate_sitemap, fetch_sitemap_xml

urlpatterns = [
    # Existing endpoints
    path('api/user-info/', user_info, name='user_info'),
    path('api/register/', register_user, name='register_user'),
    path('api/profile/update/', update_own_profile, name='update_own_profile'),
    path('api/profile/change-password/', change_password, name='change_password'),
    path('api/profile/corporate/', corporate_profile, name='corporate_profile'),
    path('api/profile/payment-methods/', payment_methods, name='payment_methods'),
    path('api/profile/payment-methods/<int:method_id>/', payment_method_detail, name='payment_method_detail'),
    path('api/profile/subscriptions/', user_subscriptions, name='user_subscriptions'),
    path('api/profile/subscriptions/<int:subscription_id>/', subscription_detail, name='subscription_detail'),
    path('api/profile/billing-history/', billing_history, name='billing_history'),
    path('api/monitor/sites/', monitored_site_list, name='monitored_site_list'),
    path('api/monitor/sites/<int:site_id>/', monitored_site_detail, name='monitored_site_detail'),
    path('api/sitemap/', generate_sitemap, name='generate_sitemap'),
    path('api/sitemap-xml/', fetch_sitemap_xml, name='fetch_sitemap_xml'),
    
    # New user management endpoints
    path('api/users/', list_users, name='list_users'),
    path('api/users/create/', create_user, name='create_user'),
    path('api/users/<int:user_id>/', get_user, name='get_user'),
    path('api/users/<int:user_id>/update/', update_user, name='update_user'),
    path('api/users/<int:user_id>/delete/', delete_user, name='delete_user'),
    path('api/users/<int:user_id>/role/', assign_role, name='assign_role'),
    path('api/users/stats/', user_stats, name='user_stats'),
    
    # Role management endpoints
    path('api/roles/', list_roles, name='list_roles'),
    path('api/roles/create/', create_role, name='create_role'),
    path('api/roles/<int:role_id>/', get_role, name='get_role'),
    path('api/roles/<int:role_id>/update/', update_role, name='update_role'),
    path('api/roles/<int:role_id>/delete/', delete_role, name='delete_role'),
    path('api/roles/<int:role_id>/permissions/', get_role_permissions, name='get_role_permissions'),
    path('api/roles/<int:role_id>/permissions/update/', update_role_permissions, name='update_role_permissions'),
    path('api/permissions/', list_permissions, name='list_permissions'),
]
