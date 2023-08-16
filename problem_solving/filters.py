from django.db.models import Prefetch, Q
from rest_framework import filters
from problem_solving.models import Metrics, Scales


class ObserverFilter(filters.BaseFilterBackend):
    DATE_FILTERS = ('range', 'date', 'day', 'week', 'month', 'year',)
    SCALE_FILTERS = ('title', 'type')

    def _get_filter_queryset_metrics(self, request):
        for filter_type in self.DATE_FILTERS:
            value = request.query_params.get(filter_type, None)
            if value:
                value = value.split(',') if filter_type == 'range' else value
                return Metrics.objects.filter(Q(**{f'datetime__{filter_type}': value}))

    def _get_filter_queryset_scale(self, request):
        for filter_fild in self.SCALE_FILTERS:
            value = request.query_params.get(filter_fild, None)
            if value:
                return Scales.objects.filter(Q(**{f'{filter_fild}__in': value.split(',')}))

    def filter_queryset(self, request, queryset, view):
        metrics_queryset = self._get_filter_queryset_metrics(request)
        scale_queryset = self._get_filter_queryset_scale(request)
        return queryset.prefetch_related(
            Prefetch('scales_set', queryset=scale_queryset),
            Prefetch('scales_set__metrics_set', queryset=metrics_queryset)
        )
