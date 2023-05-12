from logging import exception

from djoser.serializers import UserSerializer
from rest_framework.exceptions import ValidationError
from rest_framework.relations import SlugRelatedField
from rest_framework.serializers import Serializer, ModelSerializer, CharField, SerializerMethodField
from rest_framework.utils import model_meta
from rest_framework.validators import UniqueTogetherValidator

from problem_solving.models import (User, Problem, Category, TodoList,
                                    SearchProblem,
                                    ExploreProblem,
                                    FormalizingProblem,
                                    SolutionSearchProblem,
                                    EvaluationSolutionsProblem,
                                    PROBLEM_MODELS,
                                    EXPLORE_CATEGORY, Solution, Critery)


class UserSerializer(UserSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class SearchProblemSerializer(ModelSerializer):
    class Meta:
        model = SearchProblem
        fields = ("title", "description", "importance", "skill", "reasoning")


class TodoExploreSerializer(ModelSerializer):
    class Meta:
        model = TodoList
        fields = ("id", "title", "content", "created", "due_date", "completed")


class ExploreProblemSerializer(ModelSerializer):

    class Meta:
        model = ExploreProblem
        fields = ("cause_and_effect", "problem_parts", "identify")


class SolutionSearchSerializer(ModelSerializer):
    class Meta:
        model = SolutionSearchProblem
        fields = ('sota', 'example_solutions', 'solutions')


class EvaluationSolutionsSerializer(ModelSerializer):
    class Meta:
        model = EvaluationSolutionsProblem
        fields = ('solution_steps', 'criterion', 'table', 'criteria_opinion')


class FormalizingProblemSerializer(ModelSerializer):
    class Meta:
        model = FormalizingProblem
        fields = ("requirements", "interests_of_others", "preferences")


class CriteryProblemSerializer(ModelSerializer):
    class Meta:
        model = Critery
        fields = ('id', "title", "weight")


class CriterySerializer(ModelSerializer):
    problem_id = SerializerMethodField()

    class Meta:
        model = Critery
        fields = ('id', "title", "weight", 'problem_id')

    def get_problem_id(self, obj):
        return obj.problem_id

    def validate(self, attrs):
        problem_id = self.initial_data.get('problem_id')
        if not problem_id:
            raise ValidationError('problem_id is required')
        attrs["problem_id"] = problem_id
        return attrs


class SolutionProblemSerializer(ModelSerializer):
    class Meta:
        model = Solution
        fields = ('id', 'title', "steps", 'weight_critery', 'settings')


class SolutionSerializer(ModelSerializer):
    problem_id = SerializerMethodField()

    class Meta:
        model = Solution
        fields = ('id', 'title', "steps", 'weight_critery', 'problem_id', 'settings')

    def get_problem_id(self, obj):
        return obj.problem_id

    def validate(self, attrs):
        problem_id = self.initial_data.get('problem_id')
        if not problem_id:
            raise ValidationError('problem_id is required')
        attrs["problem_id"] = problem_id
        return attrs


class ProblemSerializer(ModelSerializer):
    search_problem = SearchProblemSerializer(required=False)
    explore_problem = ExploreProblemSerializer(required=False)
    formalizing_problem = FormalizingProblemSerializer(required=False)
    solutions_search_problem = SolutionSearchSerializer(required=False)
    evaluation_solution_problem = EvaluationSolutionsSerializer(required=False)
    criterion = CriteryProblemSerializer(source='critery_set.all', many=True, required=False)
    solutions = SolutionProblemSerializer(source='solution_set.all', many=True, required=False)
    todos = TodoExploreSerializer(source='todolist_set.all', many=True, required=False)

    class Meta:
        model = Problem
        fields = ("id", "title", "author",
                  "criterion",
                  "solutions",
                  'todos',
                  "search_problem",
                  "explore_problem",
                  "formalizing_problem",
                  'solutions_search_problem',
                  'evaluation_solution_problem',)

    def validate(self, attrs):
        for key, value in self.initial_data.items():
            if value and key in PROBLEM_MODELS.keys() and len(value):
                attrs[key] = value
        return attrs

    def create(self, validated_data):
        problem = Problem(author_id=self.context.get("request").user.pk,
                          title=validated_data.get("title"))
        for field, model in PROBLEM_MODELS.items():
            if field in validated_data.keys():
                object_model = model(**validated_data[field])
            else:
                object_model = model()
            object_model.save()
            setattr(problem, field, object_model)
        problem.save()
        return problem

    def update(self, instance, validated_data):
        for model, dictionary in validated_data.items():
            if model in PROBLEM_MODELS.keys():
                object_model = PROBLEM_MODELS[model].objects.get(pk=instance.pk)
                for field, value in dictionary.items():
                    if hasattr(object_model, field):
                        setattr(object_model, field, value)
                object_model.save()
            elif hasattr(instance, model):
                # если обрабатываемое значение это не модель а поле, добавляем его
                setattr(instance, model, dictionary)
        instance.save()
        return instance


class CategorySerializer(ModelSerializer):
    class Meta:
        model = Category
        fields = ("color", "id")


class ProblemTitleSerializer(ModelSerializer):
    class Meta:
        model = Problem
        fields = ('title', 'id')


class TodoListSerializer(ModelSerializer):
    problem = ProblemTitleSerializer(required=False)
    category = SerializerMethodField()

    def validate(self, attrs):
        problem_id = self.initial_data.get('problem')
        category_id = self.initial_data.get('category')
        if problem_id:
            if problem_id.__class__.__name__ == 'dict':
                problem_id = problem_id.get('id')
            attrs['problem_id'] = problem_id
        if category_id:
            if category_id.__class__.__name__ == 'dict':
                category_id = category_id.get('id')
            attrs['category_id'] = category_id
        return attrs

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        instance.save()
        return instance

    # def get_problem(self, obj):
    #     if not obj.problem:
    #         return {}
    #     return ProblemTitleSerializer(obj.problem).data

    def get_category(self, obj):
        if not obj.category:
            return {}
        return CategorySerializer(obj.category).data

    class Meta:
        model = TodoList
        fields = ("id", "author", "title", "content", "created", "due_date",
                  "category",
                  "problem",
                  "completed")
