from django.urls import path, include
from rest_framework import routers

from . import views

app_name = 'api_v1'

router = routers.DefaultRouter()
router.register('chat', views.ChatViewSet, basename='chat')

urlpatterns = [
    path('v1/', include(router.urls)),
]