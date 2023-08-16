import datetime

from django.db.models import Prefetch, Q
from rest_framework import viewsets, filters, status, mixins, generics
from rest_framework.exceptions import ParseError
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from api.serializers import TodoListSerializer, ProblemSerializer, CategorySerializer, \
    ProblemTitleSerializer, SolutionSerializer, CriterySerializer, ObserverSerializer, \
    MetricSerializer, ScaleSerializer, UserSerializer, ObserverDataSerializer, PostSerializer
from problem_solving.filters import ObserverFilter
from problem_solving.models import (User, TodoList, Problem, Category, PROBLEM_MODELS, Solution,
                                    Critery, Observer, Metrics, Scales, Post)
from problem_solving.permissions import IsOwnerOrAdmin

from problem_solving.views import query_debugger


class UserViewList(mixins.ListModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = (IsAdminUser,)


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
        return TodoList.objects \
            .select_related('problem', 'category') \
            .prefetch_related('problem', 'category') \
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


class ObserverViewSet(viewsets.ModelViewSet):
    serializer_class = ObserverSerializer
    filter_backends = (ObserverFilter,)

    def get_queryset(self):
        return Observer.objects.filter(Q(user_id=self.request.user.pk))


class ObserverDataView(viewsets.ModelViewSet):
    permission_classes = (IsAdminUser,)
    queryset = Observer.objects.prefetch_related('scales_set', 'scales_set__metrics_set').all()
    serializer_class = ObserverDataSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        return queryset.get(nik=self.kwargs.get('pk'))

    def update(self, request, *args, **kwargs):
        nik = kwargs.get('pk', )
        partial = kwargs.pop('partial', False)
        instance = get_object_or_404(Observer, nik=nik)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)


class ScalesViewSet(viewsets.ModelViewSet):
    serializer_class = ScaleSerializer

    def get_queryset(self):
        teleg_nik = self.kwargs.get('nik')
        if teleg_nik:
            return Scales.objects.prefetch_related('metrics_set') \
                .filter(observer__user_id=self.request.user.pk, observer__nik=teleg_nik)
        return Scales.objects.prefetch_related('metrics_set') \
            .filter(observer__user_id=self.request.user.pk)


class MetricViewSet(viewsets.ModelViewSet):
    serializer_class = MetricSerializer

    def get_queryset(self):
        query = Q()
        filter = self.request.query_params.get('filter', None)
        print(filter)
        if self.request.successful_authenticator.__class__.__name__ == 'TokenAuthentication':
            return Problem.objects.all()
        if filter:
            try:
                startDate, endDate = filter.split(',')
                datetime.date.fromisoformat(startDate)
                datetime.date.fromisoformat(endDate)
                query = Q(datetime__range=(startDate, endDate))
            except Exception as e:
                raise ParseError(detail=f'{e}')
        return Metrics.objects.filter(query,
                                      scale=self.kwargs.get('scale_id'),
                                      scale__observer__user_id=self.request.user.pk, )


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = (IsOwnerOrAdmin,)
    pagination_class = PageNumberPagination

    def get_queryset(self):
        author = self.request.headers.get('author') or self.request.user.id
        return Post.objects.all().filter(author=author)

    def create(self, request, **kwargs):
        now = datetime.datetime.now()
        user_id = self.request.headers.get('author') or self.request.user.id
        post = Post.objects.filter(author=user_id,
                                   created__date=datetime.datetime.date(now))
        if post:
            post = post.get()
            post.text += f"{now.strftime('%H:%M')}\n{request.data.get('text')}\n"
            post.save()
            serializer = self.get_serializer(
                data={'text': post.text, 'author': post.author.id, 'created': post.created})
            serializer.is_valid()
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            request.data['author'] = user_id
            return super().create(request, **kwargs)
