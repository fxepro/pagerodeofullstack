from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PageTranslationStatusViewSet

router = DefaultRouter()
router.register(r'pages', PageTranslationStatusViewSet, basename='page-translation-status')

urlpatterns = [
    path('api/multilanguage/', include(router.urls)),
]

