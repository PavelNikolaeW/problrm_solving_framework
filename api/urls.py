from django.urls import path, include
from rest_framework import routers

from . import views

app_name = 'api_v1'

router = routers.DefaultRouter()

router.register(r'todos', views.TodoListViewSet, basename='todos')
router.register(r'criterion', views.CriteryView, basename='criterion')
router.register(r'solutions', views.SolutionView, basename='solutions')
router.register(r'problems', views.ProblemViewSet, basename='problems')
router.register(r'categories', views.CategoryViewSet, basename='categories')
router.register(r'problemList', views.ProblemViewList, basename='problemList')

urlpatterns = [
    path('v1/', include(router.urls)),
]
