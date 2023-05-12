from django.contrib import admin

from .models import (
    Problem,
    TodoList,
    Category,
    Critery,
    Solution,
    SearchProblem,
    ExploreProblem,
    FormalizingProblem,
    SolutionSearchProblem,
    EvaluationSolutionsProblem
)


class CriteryAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'weight', 'problem'
    )


class SolutionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'steps', 'problem', 'weight_critery', 'settings'
    )


class ProblemAdmin(admin.ModelAdmin):
    list_display = (
        "id", "author",
        "search_problem",
        "explore_problem",
        "formalizing_problem",
        "solutions_search_problem",
        "evaluation_solution_problem"
    )


class SearchProblemAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "description", "importance", "skill", "reasoning"
    )


class ExplorationProblemAdmin(admin.ModelAdmin):
    list_display = (
        "id", "cause_and_effect", "problem_parts", "identify"
    )


class FormalizingProblemAdmin(admin.ModelAdmin):
    list_display = (
        "id", "requirements", "interests_of_others", "preferences"
    )


class SolutionSearchProblemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sota",
        "example_solutions",
        "solutions"
    )


class EvaluationSolutionsProblemAdmin(admin.ModelAdmin):
    list_display = ("id", "solution_steps", "criterion", "table", "criteria_opinion")


class TodoListAdmin(admin.ModelAdmin):
    list_display = (
        "id", "author", "title", "content", "created", "due_date", "category", "problem", "completed"
    )


class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id", "color"
    )


admin.site.register(Problem, ProblemAdmin)
admin.site.register(Critery, CriteryAdmin)
admin.site.register(Solution, SolutionAdmin)
admin.site.register(SearchProblem, SearchProblemAdmin)
admin.site.register(ExploreProblem, ExplorationProblemAdmin)
admin.site.register(FormalizingProblem, FormalizingProblemAdmin)
admin.site.register(SolutionSearchProblem, SolutionSearchProblemAdmin)
admin.site.register(EvaluationSolutionsProblem, EvaluationSolutionsProblemAdmin)
admin.site.register(TodoList, TodoListAdmin)
admin.site.register(Category, CategoryAdmin)
