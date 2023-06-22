FROM python:3.9
USER root

WORKDIR problem-solvig
COPY . ./

RUN pip install -r requirements.txt

ENTRYPOINT /problem-solvig/manage.py runserver 0.0.0.0:$PORT_SERVER
