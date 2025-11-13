from django.urls import path
from . import views

urlpatterns = [
    path('api/dns/servers/', views.get_dns_servers, name='dns-servers'),
]

