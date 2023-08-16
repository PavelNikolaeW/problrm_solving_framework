import datetime

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User

User = get_user_model()

search_problem_des_help_text = "Описать то что дискомфортно, понять что не устраивает в этом мире. " \
                               "Или получить описание проблемы от других людей"

EXPLORE_CATEGORY = 1


class Category(models.Model):
    """Категории задач"""
    COLORS = (
        (0, "danger"),
        (1, "info"),
        (2, "purple"),
        (3, "cyan"),
        (4, "pink"),
        (5, "yellow"),
        (6, "success"),
        (7, "primary"),
        (8, "orange"),
        (9, "indigo"),
    )
    color = models.PositiveIntegerField(choices=COLORS)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return "Colors"


class TodoList(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="todolist", default=1)
    title = models.CharField(max_length=250)
    content = models.TextField(blank=True)
    created = models.DateField(default=timezone.now)
    due_date = models.DateField(default=timezone.now)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, blank=True, null=True)
    problem = models.ForeignKey("Problem", on_delete=models.CASCADE, blank=True, null=True)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return self.title


class Critery(models.Model):
    title = models.CharField(max_length=100)
    weight = models.IntegerField(default=0, blank=True, null=True)
    problem = models.ForeignKey('Problem', on_delete=models.CASCADE, )

    def __str__(self):
        return self.title


class Solution(models.Model):
    title = models.CharField(max_length=100, default='test')
    steps = models.JSONField(blank=True, default=list, null=True)
    weight_critery = models.JSONField(blank=True, default=dict, null=True)
    problem = models.ForeignKey('Problem', on_delete=models.CASCADE, )
    settings = models.JSONField(blank=True, default=dict)

    def __str__(self):
        return f"{self.problem} solution"


class Problem(models.Model):
    author = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    title = models.CharField(max_length=100, blank=True, default="Problem")

    search_problem = models.OneToOneField("SearchProblem", on_delete=models.CASCADE, blank=True,
                                          null=True)
    explore_problem = models.OneToOneField("ExploreProblem", on_delete=models.CASCADE, blank=True,
                                           null=True)
    formalizing_problem = models.OneToOneField("FormalizingProblem", on_delete=models.CASCADE,
                                               blank=True, null=True)
    solutions_search_problem = models.OneToOneField('SolutionSearchProblem',
                                                    on_delete=models.CASCADE, blank=True, null=True)
    evaluation_solution_problem = models.OneToOneField('EvaluationSolutionsProblem',
                                                       on_delete=models.CASCADE, blank=True,
                                                       null=True)

    class Meta:
        verbose_name = "Problem"
        verbose_name_plural = "Problems"

    def __str__(self):
        if self.search_problem:
            return self.search_problem.title
        return str(self.pk)


class SearchProblem(models.Model):
    """Стратегирование и поиск проблем"""
    title = models.CharField(max_length=100, help_text="Название проблемы", blank=False)
    description = models.TextField(help_text=search_problem_des_help_text, blank=True)
    # важность
    importance = models.PositiveIntegerField(default=0, help_text="Сколько сил вы готовы потратить",
                                             blank=True,
                                             validators=[MinValueValidator(0),
                                                         MaxValueValidator(10)])
    # трудозатратность
    skill = models.PositiveIntegerField(default=0, help_text="Сколько сил у вас есть", blank=True,
                                        validators=[MinValueValidator(0), MaxValueValidator(10)])
    # обоснование
    reasoning = models.TextField(blank=True, help_text="Почему это ваша проблема?", null=True)

    def __str__(self):
        return f"{self.title}"[0:20]


class ExploreProblem(models.Model):
    """Исследование проблемы"""
    cause_and_effect = models.JSONField(blank=True, help_text="Цепочка из причин и следствий",
                                        default=list)
    problem_parts = models.JSONField(blank=True, help_text="Составные части проблемы и их размеры",
                                     default=list)
    identify = models.TextField(blank=True, help_text="Определить место проблемы в мире", null=True)

    def __str__(self):
        return f"{self.identify}"[0:20]


class FormalizingProblem(models.Model):
    """Формализация проблемы. Формулируем задачу, описываем результат"""
    requirements = models.JSONField(blank=True, help_text="Требования к результату", default=list)
    interests_of_others = models.TextField(blank=True,
                                           help_text="Как решение проблмы может повлиять на других людей?",
                                           null=True)
    preferences = models.JSONField(blank=True, help_text="То, что я получу решив проблему",
                                   default=list)

    def __str__(self):
        return f"{self.interests_of_others}"[0:20]


class SolutionSearchProblem(models.Model):
    sota = models.JSONField(blank=True, null=True, help_text="Лучшие практики")
    example_solutions = models.TextField(blank=True, null=True,
                                         help_text="Как эту проблему решали другие люди")
    # предварительная оценка решений по тем частям проблемы которые они решают
    solutions = models.JSONField(blank=True, default=list,
                                 help_text='Придумать максимальное количество возможных решений')

    def __str__(self):
        return f"{self.pk}"[0:20]


class EvaluationSolutionsProblem(models.Model):
    # список списков, для каждого солюшена
    solution_steps = models.JSONField(blank=True, null=True,
                                      help_text='Необходимые шаги для каждого из решений')
    # ключ - значение? или имя критерия, вес и список со значениями для каждого решения
    criterion = models.JSONField(blank=True, null=True,
                                 help_text='Критерии оценки решения и вес каждого')
    table = models.JSONField(blank=True, null=True,
                             help_text='Таблица с оценкой решений по критериям')
    criteria_opinion = models.TextField(blank=True, null=True,
                                        help_text='Мнение других людей о мох критериях оценки что '
                                                  'бы скорректировать веса')

    def __str__(self):
        return f"{self.pk}"[0:20]


class Metrics(models.Model):
    scale = models.ForeignKey('Scales', on_delete=models.CASCADE)
    value = models.SmallIntegerField(blank=True, null=True)
    datetime = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-datetime']

    def __str__(self):
        return f'{self.scale.title} {self.datetime.hour} {self.value}'


class Scales(models.Model):
    observer = models.ForeignKey('Observer', on_delete=models.CASCADE)
    title = models.CharField(max_length=100, help_text='То что измеряем')
    description = models.TextField(blank=True, null=True, help_text='Описание шкалы')
    type = models.CharField(max_length=10, default='range', help_text='тип шкалы')

    def __str__(self):
        return self.title


class Observer(models.Model):
    user = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    nik = models.CharField(max_length=256, help_text='Ник в телеграмме', db_index=True)
    interval = models.IntegerField(default=3600,
                                   help_text='интервал через который будут приходить напоминания')
    start_time = models.DateTimeField(default=datetime.datetime.strptime('7:15:00', '%H:%M:%S'),
                                      help_text='начало оповещений')
    end_time = models.DateTimeField(default=datetime.datetime.strptime('22:15:00', '%H:%M:%S'),
                                    help_text='конец оповещений')
    end_date = models.DateTimeField(default=datetime.datetime.now() + datetime.timedelta(weeks=104))
    days_of_week = models.JSONField(default=[0, 1, 2, 3, 4, 5, 6],
                                    help_text="Дни когда работают оповещения")
    is_active = models.BooleanField(default=True, help_text='Включены оповешения или нет')
    chat_id = models.BigIntegerField(null=True, blank=True, help_text='идентификатор чата в телеге')

    def __str__(self):
        return self.nik


class Post(models.Model):
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.text[:15]

    class Meta:
        ordering = ['-created']


PROBLEM_MODELS = {
    "search_problem": SearchProblem,
    "explore_problem": ExploreProblem,
    "formalizing_problem": FormalizingProblem,
    "solutions_search_problem": SolutionSearchProblem,
    "evaluation_solution_problem": EvaluationSolutionsProblem,
}
