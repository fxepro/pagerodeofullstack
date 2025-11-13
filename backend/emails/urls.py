from django.urls import path
from . import views

urlpatterns = [
    path('api/contact/', views.send_contact_email, name='send_contact_email'),
    path('api/feedback/', views.send_feedback_email, name='send_feedback_email'),
    path('api/consultation/', views.send_consultation_email, name='send_consultation_email'),
    path('api/update-signup/', views.send_update_signup, name='send_update_signup'),
]
