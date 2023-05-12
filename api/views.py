from django.db.models import Prefetch
from rest_framework import viewsets, filters, status, mixins
from rest_framework.viewsets import GenericViewSet

from api.serializers import TodoListSerializer, ProblemSerializer, CategorySerializer, \
    ProblemTitleSerializer, SolutionSerializer, CriterySerializer
from problem_solving.models import (User, TodoList, Problem, Category, PROBLEM_MODELS, Solution,
                                    Critery)

from problem_solving.views import query_debugger


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    def get_queryset(self):
        return Category.objects.filter(problem__author=self.request.user.pk)


class CriteryView(mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.RetrieveModelMixin,
                  GenericViewSet):
    serializer_class = CriterySerializer

    def get_queryset(self):
        return Critery.objects.select_related().filter(problem__author__id=self.request.user.pk)


class SolutionView(mixins.CreateModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.DestroyModelMixin,
                   mixins.RetrieveModelMixin,
                   GenericViewSet):
    serializer_class = SolutionSerializer

    def get_queryset(self):
        return Solution.objects.select_related().filter(problem__author__id=self.request.user.pk)


class TodoListViewSet(viewsets.ModelViewSet):
    serializer_class = TodoListSerializer
    filterset_fields = ['category', 'problem', 'completed']
    ordering_fields = ['created', 'due_date']

    def get_queryset(self):
        return TodoList.objects\
            .select_related('problem', 'category')\
            .prefetch_related('problem', 'category')\
            .filter(author=self.request.user.pk)


class ProblemViewList(viewsets.ModelViewSet):
    serializer_class = ProblemTitleSerializer

    def get_queryset(self):
        return Problem.objects.filter(author=self.request.user.pk)


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer

    def get_queryset(self):
        return Problem.objects.select_related(
            'search_problem',
            'formalizing_problem',
            'explore_problem',
            'solutions_search_problem',
            'evaluation_solution_problem',
            ).prefetch_related(
                Prefetch('solution_set'),
                Prefetch('critery_set'),
                Prefetch('todolist_set'),
            ).filter(author=self.request.user.pk)

    @query_debugger
    def perform_destroy(self, instance):
        for field in PROBLEM_MODELS.keys():
            if hasattr(instance, field):
                getattr(instance, field).delete()
        instance.delete()
