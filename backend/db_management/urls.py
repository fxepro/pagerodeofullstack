"""
URL configuration for db_management app
"""
from django.urls import path
from . import views

app_name = 'db_management'

urlpatterns = [
    # Connection management
    path('', views.database_connections_list, name='database_connections_list'),
    path('<int:pk>/', views.database_connection_detail, name='database_connection_detail'),
    path('<int:pk>/test/', views.test_connection, name='test_connection'),
    
    # Database operations
    path('<int:pk>/schemas/', views.list_schemas, name='list_schemas'),
    path('<int:pk>/tables/', views.list_tables, name='list_tables'),
    path('<int:pk>/tables/<str:table>/columns/', views.list_columns, name='list_columns'),
    path('<int:pk>/tables/<str:table>/preview/', views.preview_table_data, name='preview_table_data'),
    path('<int:pk>/query/', views.execute_query, name='execute_query'),
    
    # Logs and metrics
    path('<int:pk>/logs/', views.activity_logs, name='activity_logs'),
    path('<int:pk>/performance/', views.performance_metrics, name='performance_metrics'),
]

