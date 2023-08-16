#!/bin/sh

python manage.py makemigrations
python manage.py migrate problem_solving
python manage.py runserver 0.0.0.0:27015
