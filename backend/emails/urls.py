from django.urls import path
from . import views

urlpatterns = [
    path('api/contact/', views.send_contact_email, name='send_contact_email'),
    path('api/feedback/', views.send_feedback_email, name='send_feedback_email'),
    path('api/consultation/', views.send_consultation_email, name='send_consultation_email'),
    path('api/demo-request/', views.send_demo_request, name='send_demo_request'),
    path('api/update-signup/', views.send_update_signup, name='send_update_signup'),
    
    # Admin feedback management endpoints
    path('api/admin/feedback/', views.list_feedback, name='list_feedback'),
    path('api/admin/feedback/stats/', views.feedback_stats, name='feedback_stats'),
    path('api/admin/feedback/<int:feedback_id>/', views.get_feedback, name='get_feedback'),
    path('api/admin/feedback/<int:feedback_id>/update/', views.update_feedback, name='update_feedback'),
    path('api/admin/feedback/<int:feedback_id>/delete/', views.delete_feedback, name='delete_feedback'),
]
