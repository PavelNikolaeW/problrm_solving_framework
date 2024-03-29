
from django.shortcuts import render, get_object_or_404

from api.serializers import ProblemSerializer
from .models import (Problem, Category, TodoList)
from django.contrib.auth import get_user_model
from django.db import connection, reset_queries
import time
import functools
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .forms import CreationForm
from .tasks import test_task
from django.shortcuts import redirect

User = get_user_model()


def notification(request, ):
    print("Notification")
    test_task.apply_async(args=['kek', 'lol'], countdown=24 * 60 * 60)
    return redirect('problem_solving:index')


class SignUp(CreateView):
    form_class = CreationForm
    success_url = reverse_lazy('auth:login')
    template_name = 'registration/registration.html'


def test(request):
    return render(request, 'test.html')


def query_debugger(func):
    @functools.wraps(func)
    def inner_func(*args, **kwargs):
        reset_queries()

        start_queries = len(connection.queries)

        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()

        end_queries = len(connection.queries)

        print(f"Function : {func.__name__}")
        print(f"Number of Queries : {end_queries - start_queries}")
        print(f"Finished in : {(end - start):.2f}s")
        return result

    return inner_func


def technical_maintenance(request):
    return render(request, 'tech_worck.html')


def observation(request):
    return render(request, 'observation/observation.html')


def index(request):
    # return redirect('problem_solving:technical_maintenance')
    if not request.user.is_authenticated:
        return redirect('problem_solving:about_us')
    return render(request, 'index.html')


def about(request):

    with open('templates/about_us.md', 'r', encoding='utf-8') as f:
        return render(request, 'about.html', {'content': f.read()})


def todo(request):
    if not request.user.is_authenticated:
        return redirect('problem_solving:about_us')
    return render(request, 'todo/main-todo.html')


def byaes(request):
    return render(request, 'byaes.html')
