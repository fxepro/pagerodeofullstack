from django.urls import path
from .views import (
    list_locations,
    get_location,
    update_location,
    list_runner_health,
    get_runner_health,
    update_runner_health,
)

app_name = 'multilocation'

urlpatterns = [
    # Location management endpoints
    path('api/locations/', list_locations, name='list_locations'),
    path('api/locations/<int:location_id>/', update_location, name='update_location'),
    
    # Runner health endpoints
    path('api/runner-health/', list_runner_health, name='list_runner_health'),
    path('api/runner-health/<str:runner_id>/', update_runner_health, name='update_runner_health'),
]

