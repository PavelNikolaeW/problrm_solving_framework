from django.urls import path
from . import views


app_name = 'problem_solving'

urlpatterns = [
    path('', views.index, name='index'),
    path('about_us/', views.about, name='about_us'),
    path('todo/', views.todo, name='todo'),
    path('registration/', views.SignUp.as_view(), name='registration'),
]
