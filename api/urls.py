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
router.register(r'observer/scale/(?P<scale_id>\d+)', views.MetricViewSet, basename='metrics')
router.register(r'observer/data', views.ObserverDataView, basename='observer_data')
router.register(r'observer', views.ObserverViewSet, basename='observer')
router.register(r'scales', views.ScalesViewSet, basename='scales')
router.register(r'scales/nik/(?P<nik>@\w+)', views.ScalesViewSet, basename='scales_nik')
router.register(r'users', views.UserViewList, basename='users')
router.register(r'posts', views.PostViewSet, basename='posts')

urlpatterns = [
    path('v1/', include(router.urls)),
]
