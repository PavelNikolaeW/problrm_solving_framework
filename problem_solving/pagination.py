from rest_framework.pagination import PageNumberPagination


class PostPagination(PageNumberPagination):
    PAGR_SIZE = 10
