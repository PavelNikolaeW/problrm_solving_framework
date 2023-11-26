#!/bin/sh

python manage.py makemigrations problem_solving
python manage.py migrate problem_solving
python manage.py runserver 0.0.0.0:8000
